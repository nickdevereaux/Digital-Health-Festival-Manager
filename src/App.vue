<template>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">{{ agenda.eventData.title }}</h1>
        <p class="app-subtitle">{{ agenda.eventData.dates }} · {{ agenda.eventData.location }}</p>
      </div>
      <div class="header-controls">
        <!-- Day selector -->
        <div class="day-selector">
          <button
            v-for="day in agenda.days"
            :key="day.no"
            class="day-btn"
            :class="{ active: agenda.selectedDay === day.no }"
            @click="agenda.selectDay(day.no)"
          >
            {{ day.label }}
          </button>
        </div>
        <!-- Search -->
        <div class="search-box">
          <input
            v-model="agenda.searchQuery"
            type="text"
            placeholder="Search sessions, speakers, locations..."
            class="search-input"
          />
        </div>
        <!-- View mode -->
        <div class="view-mode">
          <button
            class="view-btn"
            :class="{ active: agenda.viewMode === 'timeline' }"
            @click="agenda.switchView('timeline')"
          >
            Timeline
          </button>
          <button
            class="view-btn"
            :class="{ active: agenda.viewMode === 'grid' }"
            @click="agenda.switchView('grid')"
          >
            Grid
          </button>
        </div>
        <!-- Favorites filter -->
        <button
          class="fav-filter-btn"
          :class="{ active: agenda.favoritesOnly }"
          @click="agenda.toggleFavoritesFilter"
        >
          ★ Favorites
        </button>
      </div>
    </header>

    <!-- Streams filter -->
    <div class="streams-bar">
      <span class="streams-label">Streams:</span>
      <button
        v-for="stream in agenda.streams"
        :key="stream.key"
        class="stream-btn"
        :class="{ active: agenda.selectedStreams.includes(stream.key) }"
        :style="{ borderColor: stream.color }"
        @click="agenda.toggleStream(stream.key)"
      >
        <span class="stream-dot" :style="{ backgroundColor: stream.color }"></span>
        {{ stream.label }}
        (<span>{{ agenda.allSessions.filter(s => s.stream === stream.key).length }}</span>)
      </button>
    </div>

    <!-- Main content -->
    <div class="main-content">
      <!-- Timeline view -->
      <div v-if="agenda.viewMode === 'timeline'" class="timeline-view">
        <div
          v-for="hour in agenda.currentHours"
          :key="hour"
          class="timeline-hour"
        >
          <div class="hour-label">{{ formatTime(hour * 100) }}</div>
          <div class="hour-sessions">
            <div
              v-for="session in agenda.filteredSessions.filter(s => Math.floor(s.time / 100) === hour)"
              :key="session.id"
              class="session-timeline-card"
              :class="{ favorite: agenda.isFavorite(session.id), 'on-now': isSessionNow(session) }"
              @click="agenda.selectSession(session)"
            >
              <div class="session-time-badge">{{ formatTime(session.time) }}</div>
              <div class="session-header">
                <span
                  class="stream-tag"
                  :style="{ backgroundColor: agenda.getStreamColor(session.stream) }"
                >
                  {{ session.streamLabel }}
                </span>
                <button
                  class="fav-btn"
                  :class="{ active: agenda.isFavorite(session.id) }"
                  @click.stop="agenda.toggleFavorite(session.id)"
                >
                  {{ agenda.isFavorite(session.id) ? '★' : '☆' }}
                </button>
              </div>
              <h3 class="session-title">{{ session.title }}</h3>
              <p class="session-location">{{ session.location }}</p>
              <div class="session-speakers">
                <div
                  v-for="speaker in session.speakers"
                  :key="speaker.name"
                  class="speaker-chip"
                >
                  <img
                    v-if="speaker.photoUrl"
                    :src="speaker.photoUrl"
                    :alt="speaker.name"
                    class="speaker-photo"
                    loading="lazy"
                  />
                  <span class="speaker-name">{{ speaker.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid view -->
      <div v-else class="grid-view">
        <div class="grid-columns">
          <div
            v-for="stream in agenda.activeStreams"
            :key="stream.key"
            class="grid-column"
          >
            <div class="grid-column-header" :style="{ backgroundColor: stream.color }">
              {{ stream.label }}
              (<span>{{ agenda.filteredSessions.filter(s => s.stream === stream.key).length }}</span>)
            </div>
            <div class="grid-column-sessions">
              <div
                v-for="session in agenda.filteredSessions.filter(s => s.stream === stream.key)"
                :key="session.id"
                class="session-grid-card"
                :class="{ favorite: agenda.isFavorite(session.id) }"
                @click="agenda.selectSession(session)"
              >
                <div class="session-time">{{ formatTime(session.time) }}</div>
                <h4 class="session-grid-title">{{ session.title }}</h4>
                <p class="session-grid-location">{{ session.location }}</p>
                <button
                  class="fav-btn small"
                  :class="{ active: agenda.isFavorite(session.id) }"
                  @click.stop="agenda.toggleFavorite(session.id)"
                >
                  {{ agenda.isFavorite(session.id) ? '★' : '☆' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Session detail overlay -->
    <Transition>
      <div v-if="agenda.selectedSession" class="session-overlay" @click="agenda.selectSession(agenda.selectedSession)">
        <div class="session-detail" @click.stop>
          <button class="close-btn" @click="agenda.selectSession(agenda.selectedSession)">×</button>
          <div class="detail-header">
            <span
              class="stream-tag large"
              :style="{ backgroundColor: agenda.getStreamColor(agenda.selectedSession.stream) }"
            >
              {{ agenda.selectedSession.streamLabel }}
            </span>
            <button
              class="fav-btn large"
              :class="{ active: agenda.isFavorite(agenda.selectedSession.id) }"
              @click="agenda.toggleFavorite(agenda.selectedSession.id)"
            >
              {{ agenda.isFavorite(agenda.selectedSession.id) ? '★' : '☆' }}
            </button>
          </div>
          <h2 class="detail-title">{{ agenda.selectedSession.title }}</h2>
          <p class="detail-time">{{ formatTime(agenda.selectedSession.time) }} · {{ agenda.selectedSession.location }}</p>
          <div class="detail-speakers">
            <h3>Speakers</h3>
            <div
              v-for="speaker in agenda.selectedSession.speakers"
              :key="speaker.name"
              class="speaker-detail"
            >
              <img
                v-if="speaker.photoUrl"
                :src="speaker.photoUrl"
                :alt="speaker.name"
                class="speaker-photo large"
              />
              <div>
                <div class="speaker-name">{{ speaker.name }}</div>
                <div class="speaker-role">{{ speaker.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useAgendaStore } from './store/agenda';
import { ref, computed, onMounted, onUnmounted } from 'vue';

const agenda = useAgendaStore();

// Update current time every minute
let timeInterval = null;

onMounted(() => {
  timeInterval = setInterval(() => {
    // Just trigger reactivity
  }, 60000);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});

function isSessionNow(session) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentNum = currentHour * 100 + currentMin;

  // Check if session is within the next hour or the current hour
  return session.time <= currentNum && session.time + 60 >= currentNum;
}

function formatTime(timeNum) {
  const hours = Math.floor(timeNum / 100);
  const mins = timeNum % 100;
  const period = hours >= 12 ? 'pm' : 'am';
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${h}:${String(mins).padStart(2, '0')}${period}`;
}
</script>

<style scoped>
/* Header */
.app-header {
  background: #1a1a2e;
  color: white;
  padding: 1rem 2rem;
  border-bottom: 3px solid #e94560;
}

.header-content h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.header-content p {
  margin: 0.25rem 0 0;
  opacity: 0.8;
}

.header-controls {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.day-selector {
  display: flex;
  gap: 0.25rem;
}

.day-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255,255,255,0.3);
  background: transparent;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.day-btn.active,
.day-btn:hover {
  background: #e94560;
  border-color: #e94560;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.1);
  color: white;
  border-radius: 4px;
  min-width: 200px;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.6);
}

.view-mode {
  display: flex;
  gap: 0.25rem;
}

.view-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255,255,255,0.3);
  background: transparent;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.view-btn.active {
  background: #16213e;
  border-color: #0f3460;
}

.fav-filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #ffc107;
  background: transparent;
  color: #ffc107;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.fav-filter-btn.active {
  background: #ffc107;
  color: #1a1a2e;
}

/* Streams bar */
.streams-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  flex-wrap: wrap;
  align-items: center;
}

.streams-label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.stream-btn {
  padding: 0.375rem 0.75rem;
  border: 2px solid;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  opacity: 0.7;
}

.stream-btn.active {
  opacity: 1;
  font-weight: 600;
}

.stream-btn span {
  font-weight: 600;
}

.stream-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

/* Main content */
.main-content {
  height: calc(100vh - 180px);
  overflow-y: auto;
  padding: 1rem;
}

/* Timeline view */
.timeline-view {
  max-width: 1200px;
  margin: 0 auto;
}

.timeline-hour {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.hour-label {
  font-weight: 600;
  color: #666;
  padding-top: 1rem;
}

.hour-sessions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.session-timeline-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 280px;
  max-width: 360px;
  position: relative;
}

.session-timeline-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.session-timeline-card.on-now {
  border: 2px solid #00ff87;
  background: #f0fff8;
}

.session-time-badge {
  font-weight: 700;
  color: #1a1a2e;
  font-size: 0.875rem;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.stream-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.fav-btn {
  background: none;
  border: 1px solid #ddd;
  cursor: pointer;
  color: #999;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.fav-btn.active {
  color: #ffc107;
  border-color: #ffc107;
  background: #fffdf0;
}

.session-title {
  margin: 0.5rem 0;
  font-size: 1rem;
  color: #1a1a2e;
}

.session-location {
  color: #666;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.session-speakers {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.speaker-chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
}

.speaker-photo {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.speaker-name {
  font-size: 0.75rem;
  white-space: nowrap;
}

/* Grid view */
.grid-view {
  height: 100%;
}

.grid-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  height: 100%;
  overflow-y: auto;
}

.grid-column {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.grid-column-header {
  padding: 0.75rem 1rem;
  color: white;
  font-weight: 600;
  border-radius: 8px 8px 0 0;
}

.grid-column-header span {
  font-weight: 400;
}

.grid-column-sessions {
  padding: 0.5rem;
  overflow-y: auto;
  flex: 1;
}

.session-grid-card {
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  border-left: 3px solid transparent;
  position: relative;
}

.session-grid-card:hover {
  background: #f8f9fa;
}

.session-grid-card.favorite {
  background: #fffdf0;
  border-left-color: #ffc107;
}

.session-time {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 0.875rem;
}

.session-grid-title {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.session-grid-location {
  color: #666;
  font-size: 0.8rem;
  margin: 0.125rem 0;
}

.session-grid-card .fav-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.875rem;
}

/* Session detail overlay */
.session-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.session-detail {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.stream-tag.large {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.fav-btn.large {
  font-size: 1.5rem;
  padding: 0.5rem 0.75rem;
}

.detail-title {
  margin: 0;
  font-size: 1.5rem;
  color: #1a1a2e;
}

.detail-time {
  color: #666;
  margin: 0.5rem 0 1rem;
}

.detail-speakers h3 {
  margin: 1rem 0 0.5rem;
}

.speaker-detail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.speaker-photo.large {
  width: 40px;
  height: 40px;
}

.speaker-detail .speaker-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.speaker-detail .speaker-role {
  color: #666;
  font-size: 0.8rem;
}

/* Transitions */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.v-enter-active .session-detail,
.v-leave-active .session-detail {
  transition: transform 0.2s ease;
}

.v-enter-from .session-detail,
.v-leave-to .session-detail {
  transform: scale(0.95);
}
</style>