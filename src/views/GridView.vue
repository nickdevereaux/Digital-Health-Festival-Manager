<template>
  <div class="grid-view">
    <div class="grid-controls">
      <div class="day-selector-inline">
        <button
          v-for="day in agenda.days"
          :key="day.no"
          class="day-btn-inline"
          :class="{ active: agenda.selectedDay === day.no }"
          @click="agenda.selectDay(day.no)"
        >
          Day {{ day.no }}
        </button>
      </div>
      <div class="streams-filter-inline">
        <button
          v-for="stream in agenda.streams"
          :key="stream.key"
          class="stream-btn-inline"
          :class="{ active: agenda.selectedStreams.includes(stream.key) }"
          :style="{ borderColor: stream.color }"
          @click="agenda.toggleStream(stream.key)"
        >
          <span class="stream-dot" :style="{ backgroundColor: stream.color }"></span>
          {{ stream.label }}
        </button>
      </div>
      <button
        class="fav-filter-btn"
        :class="{ active: agenda.favoritesOnly }"
        @click="agenda.toggleFavoritesFilter"
      >
        Favorites Only
      </button>
    </div>
    <div class="grid-content">
      <div class="grid-columns">
        <div
          v-for="stream in agenda.activeStreams"
          :key="stream.key"
          class="grid-column"
        >
          <div class="grid-column-header" :style="{ backgroundColor: stream.color }">
            {{ stream.label }}
            ({{ agenda.filteredSessions.filter(s => s.stream === stream.key).length }})
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
                {{ agenda.isFavorite(session.id) ? '\u2605' : '\u2606' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgendaStore } from '../store/agenda';

const agenda = useAgendaStore();

function formatTime(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const mins = timeNum % 100;
  const period = hours >= 12 ? 'pm' : 'am';
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${h}:${String(mins).padStart(2, '0')}${period}`;
}
</script>

<style scoped>
.grid-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.grid-controls {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-selector-inline {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.day-btn-inline {
  padding: 0.5rem 1.25rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.day-btn-inline:hover {
  background: #f8f9fa;
}

.day-btn-inline.active {
  background: #0f3460;
  border-color: #0f3460;
  color: white;
}

.streams-filter-inline {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stream-btn-inline {
  padding: 0.375rem 0.75rem;
  border: 2px solid;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  opacity: 0.7;
}

.stream-btn-inline.active {
  opacity: 1;
  font-weight: 600;
}

.stream-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.fav-filter-btn {
  padding: 0.5rem 1.25rem;
  border: 2px solid #ffc107;
  background: transparent;
  color: #ffc107;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  align-self: flex-start;
}

.fav-filter-btn.active {
  background: #ffc107;
  color: #1a1a2e;
}

.grid-content {
  height: calc(100vh - 280px);
  overflow-y: auto;
}

.grid-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
  color: #1a1a2e;
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

.fav-btn.small {
  font-size: 0.875rem;
  padding: 0.2rem 0.4rem;
}
</style>