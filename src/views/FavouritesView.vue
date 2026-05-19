<template>
  <div class="favourites-view">
    <div class="favourites-header">
      <h2>★ Favourites</h2>
      <p class="favourites-count">{{ agenda.favorites.size }} sessions favorited</p>
    </div>
    <div v-if="agenda.favorites.size === 0" class="empty-state">
      <div class="empty-icon">☆</div>
      <h3>No favourites yet</h3>
      <p>Start exploring sessions and mark them as favourites by clicking the star icon.</p>
      <router-link to="/timeline" class="browse-btn">Browse Sessions</router-link>
    </div>
    <div v-else class="favourites-content">
      <div class="favourites-filters">
        <div class="day-filter">
          <button
            class="day-filter-btn"
            :class="{ active: filterDay === 'all' }"
            @click="filterDay = 'all'"
          >
            All Days
          </button>
          <button
            v-for="day in agenda.days"
            :key="day.no"
            class="day-filter-btn"
            :class="{ active: filterDay === String(day.no) }"
            @click="filterDay = String(day.no)"
          >
            Day {{ day.no }}
          </button>
        </div>
        <div class="stream-filter">
          <button
            v-for="stream in agenda.streams"
            :key="stream.key"
            class="stream-filter-btn"
            :class="{ active: activeStreams.includes(stream.key) }"
            :style="{ borderColor: stream.color, color: activeStreams.includes(stream.key) ? stream.color : '#666' }"
            @click="toggleStream(stream.key)"
          >
            {{ stream.label }}
          </button>
        </div>
      </div>
      <div class="favourites-list">
        <div
          v-for="session in filteredFavourites"
          :key="session.id"
          class="favourite-card"
          @click="agenda.selectSession(session)"
        >
          <div class="favourite-time">{{ formatTime(session.time) }}</div>
          <div class="favourite-content">
            <span
              class="stream-tag"
              :style="{ backgroundColor: agenda.getStreamColor(session.stream) }"
            >
              {{ session.streamLabel }}
            </span>
            <h3 class="favourite-title">{{ session.title }}</h3>
            <p class="favourite-location">{{ session.location }}</p>
            <div class="favourite-speakers">
              <span
                v-for="speaker in session.speakers"
                :key="speaker.name"
                class="favourite-speaker"
              >
                {{ speaker.name }}
              </span>
            </div>
          </div>
          <button
            class="unfav-btn"
            @click.stop="agenda.toggleFavorite(session.id)"
          >
            ★
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgendaStore } from '../store/agenda';
import { ref, computed } from 'vue';

const agenda = useAgendaStore();
const filterDay = ref<string>('all');
const activeStreams = ref<string[]>(['all', 'health', 'wellness', 'technology', 'innovation']);

// Start with all streams active
agenda.streams.forEach(s => {
  activeStreams.value.push(s.key);
});
activeStreams.value = [];

const filteredFavourites = computed(() => {
  const favSessions = agenda.allSessions.filter(s => agenda.favorites.has(s.id));
  
  let result = favSessions;
  
  if (filterDay.value !== 'all') {
    result = result.filter(s => s.day === parseInt(filterDay.value));
  }
  
  result = result.filter(s => activeStreams.value.includes('all') || activeStreams.value.includes(s.stream));
  
  return result;
});

function formatTime(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const mins = timeNum % 100;
  const period = hours >= 12 ? 'pm' : 'am';
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${h}:${String(mins).padStart(2, '0')}${period}`;
}

function toggleStream(streamKey: string): void {
  const index = activeStreams.value.indexOf(streamKey);
  if (index > -1) {
    activeStreams.value.splice(index, 1);
  } else {
    activeStreams.value.push(streamKey);
  }
}
</script>

<style scoped>
.favourites-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.favourites-header {
  text-align: center;
  margin-bottom: 2rem;
}

.favourites-header h2 {
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.favourites-count {
  color: #666;
  font-size: 1rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.browse-btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #0f3460;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.browse-btn:hover {
  background: #1a4a8a;
}

.favourites-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.favourites-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.day-filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.day-filter-btn:hover {
  background: #f8f9fa;
}

.day-filter-btn.active {
  background: #0f3460;
  border-color: #0f3460;
  color: white;
}

.stream-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stream-filter-btn {
  padding: 0.375rem 0.75rem;
  border: 2px solid;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  opacity: 0.6;
}

.stream-filter-btn.active {
  opacity: 1;
  font-weight: 600;
}

.favourites-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.favourite-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  position: relative;
}

.favourite-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.favourite-time {
  font-weight: 700;
  color: #0f3460;
  font-size: 0.875rem;
  min-width: 60px;
  padding-top: 0.25rem;
}

.favourite-content {
  flex: 1;
}

.stream-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.favourite-title {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #1a1a2e;
}

.favourite-location {
  color: #666;
  font-size: 0.875rem;
  margin: 0.25rem 0;
}

.favourite-speakers {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.favourite-speaker {
  padding: 0.25rem 0.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #333;
}

.unfav-btn {
  background: none;
  border: 2px solid #ffc107;
  cursor: pointer;
  color: #ffc107;
  font-size: 1.25rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.unfav-btn:hover {
  background: #fffdf0;
  transform: scale(1.1);
}
</style>