<template>
  <div class="days-view">
    <div class="days-header">
      <h2>Select a Day</h2>
      <div class="day-selector">
        <button
          v-for="day in agenda.days"
          :key="day.no"
          class="day-card"
          :class="{ active: agenda.selectedDay === day.no }"
          @click="agenda.selectDay(day.no)"
        >
          <div class="day-number">{{ day.no }}</div>
          <div class="day-label">{{ day.label }}</div>
        </button>
      </div>
    </div>
    <div class="day-summary">
      <div v-for="day in agenda.days" :key="day.no" class="day-summary-card">
        <h3>Day {{ day.no }}: {{ day.label }}</h3>
        <div class="day-sessions">
          <div
            v-for="session in agenda.allSessions.filter(s => s.day === day.no)"
            :key="session.id"
            class="summary-session"
            :class="{ favorite: agenda.isFavorite(session.id) }"
          >
            <span class="summary-time">{{ formatTime(session.time) }}</span>
            <span class="summary-title">{{ session.title }}</span>
            <span class="summary-location">{{ session.location }}</span>
            <button
              class="fav-btn-small"
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
.days-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.days-header {
  text-align: center;
  margin-bottom: 2rem;
}

.days-header h2 {
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.day-selector {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.day-card {
  padding: 1.5rem 2rem;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  text-align: center;
}

.day-card:hover {
  border-color: #0f3460;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.day-card.active {
  background: #0f3460;
  border-color: #0f3460;
  color: white;
}

.day-number {
  font-size: 2rem;
  font-weight: 700;
}

.day-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.day-summary {
  margin-top: 2rem;
}

.day-summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.day-summary-card h3 {
  color: #1a1a2e;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f8f9fa;
}

.day-sessions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-session {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #f8f9fa;
  transition: all 0.2s;
}

.summary-session:hover {
  background: #f8f9fa;
}

.summary-session.favorite {
  background: #fffdf0;
  border-color: #ffc107;
}

.summary-time {
  font-weight: 600;
  color: #0f3460;
  font-size: 0.875rem;
  min-width: 60px;
}

.summary-title {
  flex: 1;
  color: #1a1a2e;
}

.summary-location {
  color: #666;
  font-size: 0.875rem;
}

.fav-btn-small {
  background: none;
  border: 1px solid #ddd;
  cursor: pointer;
  color: #999;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.fav-btn-small.active {
  color: #ffc107;
  border-color: #ffc107;
  background: #fffdf0;
}
</style>