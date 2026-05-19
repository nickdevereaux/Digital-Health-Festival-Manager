<template>
  <div class="timeline-view">
    <div class="timeline-controls">
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
    </div>
    <div class="timeline-content">
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
                <button
                  class="linkedin-btn"
                  :title="'Search ' + speaker.name + ' on LinkedIn'"
                  @click.stop="searchLinkedIn(speaker.name)"
                >
                  in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgendaStore } from '../store/agenda';
import { ref, onMounted, onUnmounted } from 'vue';

const agenda = useAgendaStore();

function formatTime(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const mins = timeNum % 100;
  const period = hours >= 12 ? 'pm' : 'am';
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${h}:${String(mins).padStart(2, '0')}${period}`;
}

function isSessionNow(session: { time: number }): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentNum = currentHour * 100 + currentMin;
  return session.time <= currentNum && session.time + 60 >= currentNum;
}

function searchLinkedIn(name: string): void {
  const query = encodeURIComponent(name);
  window.open(`https://www.linkedin.com/search/results/all/?keywords=${query}`, '_blank');
}

let timeInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timeInterval = setInterval(() => {}, 60000);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});
</script>

<style scoped>
.timeline-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.timeline-controls {
  margin-bottom: 1.5rem;
}

.day-selector-inline {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
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

.timeline-content {
  height: calc(100vh - 250px);
  overflow-y: auto;
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

.linkedin-btn {
  padding: 0.125rem 0.375rem;
  background: #0077B5;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.linkedin-btn:hover {
  background: #005885;
  transform: scale(1.1);
}
</style>