<template>
  <div class="search-wrapper" ref="searchWrapper">
    <!-- Search input -->
    <div class="search-container" ref="searchContainer">
      <span class="search-icon">🔍</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search sessions, speakers, locations..."
        class="search-input"
        :class="{ focused: isOpen }"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
        @keydown.escape="handleEscape"
        ref="inputRef"
      />
      <button
        v-if="searchQuery"
        class="clear-btn"
        @click="clearSearch"
        title="Clear"
      >
        ×
      </button>
    </div>

    <!-- Dropdown results -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="isOpen && showDropdown" class="search-dropdown" ref="dropdownRef">
        <!-- Filter toggle -->
        <div class="dropdown-filters">
          <button
            class="filter-toggle"
            :class="{ active: showFilters }"
            @click="showFilters = !showFilters"
          >
            ⚙ Filters
          </button>
          
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-32"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 max-h-32"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-if="showFilters" class="filter-panel">
              <label class="filter-item">
                <input type="checkbox" v-model="includeDay1" />
                <span>Day 1 - May 20</span>
              </label>
              <label class="filter-item">
                <input type="checkbox" v-model="includeDay2" />
                <span>Day 2 - May 21</span>
              </label>
              <label class="filter-item">
                <input type="checkbox" v-model="showFavoritesOnly" />
                <span>★ Favorites only</span>
              </label>
            </div>
          </Transition>
        </div>

        <!-- Empty state -->
        <div v-if="searchQuery && filteredResults.length === 0" class="dropdown-empty">
          <p>No results found for "{{ searchQuery }}"</p>
        </div>

        <!-- Results grouped by day -->
        <div v-else-if="searchQuery && filteredResults.length > 0" class="dropdown-results">
          <div v-for="dayResult in dayResults" :key="dayResult.dayNo" class="dropdown-day-section">
            <div class="day-section-header">
              <span class="day-title">{{ dayResult.dayLabel }}</span>
              <span class="day-count">{{ dayResult.results.length }}</span>
            </div>
            <div class="day-results">
              <div
                v-for="session in dayResult.results"
                :key="session.id"
                class="dropdown-result-item"
                :class="{ favorite: isFavorite(session.id) }"
                @click="selectSession(session)"
                @mouseenter="hoveredSessionId = session.id"
                @mouseleave="hoveredSessionId = null"
              >
                <div class="result-meta">
                  <span
                    class="stream-tag"
                    :style="{ backgroundColor: getStreamColor(session.stream) }"
                  >
                    {{ session.streamLabel }}
                  </span>
                  <span class="result-time">{{ formatTime(session.time) }}</span>
                </div>
                <h4 class="result-title" v-html="highlightText(session.title)"></h4>
                <p class="result-location">{{ session.location }}</p>
                <div v-if="session.speakers.length" class="result-speakers">
                  <span
                    v-for="speaker in session.speakers"
                    :key="speaker.name"
                    class="result-speaker"
                  >
                    {{ speaker.name }}
                  </span>
                </div>
                <button
                  class="fav-btn-search"
                  :class="{ active: isFavorite(session.id) }"
                  @click.stop="toggleFavorite(session)"
                  title="Toggle favorite"
                >
                  {{ isFavorite(session.id) ? '★' : '☆' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Suggestions when no search query -->
        <div v-else-if="!searchQuery" class="dropdown-suggestions">
          <div class="suggestion-title">Quick Filters</div>
          <div class="suggestion-list">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion.label"
              class="suggestion-item"
              @click="useSuggestion(suggestion.query)"
            >
              <span class="suggestion-icon">{{ suggestion.icon }}</span>
              <span class="suggestion-text">{{ suggestion.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import type { Session } from '../types';

interface Props {
  allSessions: Session[];
  favorites: number[];
  streams: { key: string; color: string; label: string }[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'updateQuery', query: string): void;
  (e: 'selectSession', session: Session): void;
  (e: 'toggleFavorite', sessionId: number): void;
}>();

// State
const searchQuery = ref('');
const isOpen = ref(false);
const showDropdown = ref(false);
const showFilters = ref(false);
const includeDay1 = ref(true);
const includeDay2 = ref(true);
const showFavoritesOnly = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);
const searchWrapper = ref<HTMLElement | null>(null);
const hoveredSessionId = ref<number | null>(null);

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Suggestions
const suggestions = [
  { query: '', label: 'All sessions', icon: '📋', showFavs: false, day1: true, day2: true },
  { query: '', label: '★ Favorites', icon: '⭐', showFavs: true, day1: true, day2: true },
  { query: 'AI', label: 'AI-related sessions', icon: '🤖', showFavs: false, day1: true, day2: true },
];

// Computed
const dayResults = computed(() => {
  if (!searchQuery.value.trim()) return [];

  const q = searchQuery.value.toLowerCase();
  const resultsByDay: Record<number, Session[]> = { 1: [], 2: [] };

  props.allSessions
    .filter((s: Session) => {
      const dayMatch = (s.day === 1 && includeDay1.value) || (s.day === 2 && includeDay2.value);
      if (!dayMatch) return false;
      if (showFavoritesOnly.value && !props.favorites.includes(s.id)) return false;
      const searchMatch =
        s.title.toLowerCase().includes(q) ||
        s.speakers.some((sp) => sp.name.toLowerCase().includes(q)) ||
        s.speakers.some((sp) => sp.role.toLowerCase().includes(q)) ||
        s.location.toLowerCase().includes(q);
      return searchMatch;
    })
    .sort((a: Session, b: Session) => a.day - b.day || a.time - b.time)
    .forEach((session: Session) => {
      resultsByDay[session.day].push(session);
    });

  return [
    { dayNo: 1, dayLabel: 'Day 1 - May 20', results: resultsByDay[1] },
    { dayNo: 2, dayLabel: 'Day 2 - May 21', results: resultsByDay[2] },
  ].filter(d => d.results.length > 0);
});

const filteredResults = computed(() => dayResults.value.flatMap(d => d.results));

function isFavorite(sessionId: number): boolean {
  return props.favorites.includes(sessionId);
}

function getStreamColor(streamKey: string): string {
  const stream = props.streams.find((s: { key: string; color: string; label: string }) => s.key === streamKey);
  return stream?.color || '#9e9e9e';
}

function formatTime(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const mins = timeNum % 100;
  const period = hours >= 12 ? 'pm' : 'am';
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${h}:${String(mins).padStart(2, '0')}${period}`;
}

function highlightText(text: string): string {
  if (!searchQuery.value.trim()) return text;
  const regex = new RegExp(`(${searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function handleFocus() {
  isOpen.value = true;
  showDropdown.value = true;
}

function handleBlur() {
  // Delay to allow clicks on dropdown to register
  setTimeout(() => {
    isOpen.value = false;
    showDropdown.value = false;
  }, 150);
}

function handleInput() {
  emit('updateQuery', searchQuery.value);
  
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    showDropdown.value = searchQuery.value.trim().length > 0;
    if (searchQuery.value.trim()) {
      showFilters.value = true; // Auto-show filters on search
    }
  }, 150);
}

function handleEscape() {
  if (searchQuery.value) {
    searchQuery.value = '';
  } else {
    isOpen.value = false;
    showDropdown.value = false;
  }
  inputRef.value?.focus();
}

function clearSearch() {
  searchQuery.value = '';
  showDropdown.value = false;
  emit('updateQuery', '');
  inputRef.value?.focus();
}

function selectSession(session: Session) {
  emit('selectSession', session);
  isOpen.value = false;
  showDropdown.value = false;
  searchQuery.value = '';
}

function toggleFavorite(session: Session) {
  emit('toggleFavorite', session.id);
}

function useSuggestion(query: string) {
  searchQuery.value = query;
  if (query) {
    showDropdown.value = true;
    showFilters.value = true;
  }
  emit('updateQuery', query);
  inputRef.value?.focus();
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (searchWrapper.value && !searchWrapper.value.contains(event.target as Node)) {
    isOpen.value = false;
    showDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

// Watch for open state changes
watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});
</script>

<style scoped>
.search-wrapper {
  position: relative;
  display: inline-block;
}

.search-container {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0 0.75rem;
  transition: all 0.2s;
  min-width: 240px;
}

.search-container.focused {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(233, 69, 96, 0.3);
}

.search-icon {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: white;
  font-size: 0.9rem;
  padding: 0.6rem 0.5rem;
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.clear-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  flex-shrink: 0;
}

.clear-btn:hover {
  color: white;
}

/* Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 480px;
  max-height: 60vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  z-index: 1600;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  background: #fafbfc;
  border-radius: 12px 12px 0 0;
}

.filter-toggle {
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  transition: all 0.2s;
}

.filter-toggle:hover {
  background: #f0f0f0;
}

.filter-toggle.active {
  background: #e94560;
  border-color: #e94560;
  color: white;
}

.filter-panel {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  overflow: hidden;
  max-height: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #555;
  white-space: nowrap;
}

.filter-item input {
  cursor: pointer;
}

.dropdown-empty,
.dropdown-suggestions {
  padding: 2rem 1.5rem;
  text-align: center;
}

.dropdown-empty p {
  color: #999;
  font-size: 0.9rem;
}

.suggestion-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: none;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  text-align: left;
  font-size: 0.85rem;
  color: #333;
  transition: all 0.15s;
  width: 100%;
}

.suggestion-item:hover {
  background: #f8f9fa;
  border-color: #e94560;
}

.suggestion-icon {
  font-size: 1.1rem;
}

.suggestion-text {
  font-weight: 500;
}

/* Results */
.dropdown-results {
  overflow-y: auto;
  flex: 1;
  max-height: calc(60vh - 60px);
}

.dropdown-day-section {
  border-bottom: 1px solid #f0f0f0;
}

.day-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: #fafbfc;
  position: sticky;
  top: 0;
  z-index: 1;
}

.day-title {
  font-weight: 600;
  color: #333;
  font-size: 0.8rem;
}

.day-count {
  background: #e9ecef;
  padding: 0.15rem 0.6rem;
  border-radius: 10px;
  font-size: 0.75rem;
  color: #666;
}

.day-results {
  display: flex;
  flex-direction: column;
}

.dropdown-result-item {
  padding: 0.75rem 1rem;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 1px solid #f5f5f5;
}

.dropdown-result-item:hover {
  background: #f8f9fa;
}

.dropdown-result-item.favorite {
  background: #fffdf0;
  border-left-color: #ffc107;
}

.dropdown-result-item.hovered {
  background: #f0f7ff;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.stream-tag {
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
}

.result-time {
  font-weight: 600;
  color: #555;
  font-size: 0.8rem;
}

.result-title {
  margin: 0;
  font-size: 0.9rem;
  color: #1a1a2e;
  margin-bottom: 0.25rem;
}

.result-title mark {
  background: #fff3b0;
  padding: 0.05rem 0.15rem;
  border-radius: 2px;
}

.result-location {
  color: #888;
  font-size: 0.78rem;
  margin: 0;
}

.result-speakers {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  margin-top: 0.375rem;
}

.result-speaker {
  background: #f0f0f0;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-size: 0.7rem;
  color: #555;
}

/* Favorite button in search results */
.fav-btn-search {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: none;
  border: 1px solid #ddd;
  cursor: pointer;
  color: #999;
  font-size: 0.9rem;
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.fav-btn-search.active {
  color: #ffc107;
  border-color: #ffc107;
  background: #fffdf0;
}

.fav-btn-search:hover {
  transform: scale(1.1);
}

.dropdown-result-item {
  position: relative;
}

/* Transitions */
.transition {
  transition: !important;
}
</style>