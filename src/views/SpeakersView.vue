<template>
  <div class="speakers-view">
    <div class="speakers-header">
      <h2>Speakers</h2>
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search speakers..."
          class="search-input"
        />
      </div>
    </div>
    <div class="speakers-grid">
      <NotableSpeakers />
      <div class="all-speakers-section">
        <h3>All Speakers</h3>
        <div class="speakers-list">
          <div
            v-for="speaker in filteredSpeakers"
            :key="speaker.name"
            class="speaker-card"
          >
            <img
              v-if="speaker.photoUrl"
              :src="speaker.photoUrl"
              :alt="speaker.name"
              class="speaker-card-photo"
            />
            <div class="speaker-card-info">
              <h4 class="speaker-card-name">{{ speaker.name }}</h4>
              <p class="speaker-card-role">{{ speaker.role }}</p>
              <div class="speaker-card-sessions">
                <span
                  v-for="sessionId in speaker.sessionIds"
                  :key="sessionId"
                  class="speaker-session-tag"
                >
                  {{ agenda.allSessions.find(s => s.id === sessionId)?.title || 'Session' }}
                </span>
              </div>
            </div>
            <button
              class="linkedin-card-btn"
              @click.stop="searchLinkedIn(speaker.name)"
            >
              in
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgendaStore } from '../store/agenda';
import { ref, computed } from 'vue';
import NotableSpeakers from '../components/NotableSpeakers.vue';

const agenda = useAgendaStore();
const searchQuery = ref('');

// Build a list of all unique speakers with their sessions
interface SpeakerInfo {
  name: string;
  role: string;
  photoUrl: string;
  sessionIds: number[];
}

const speakersMap = ref<Map<string, SpeakerInfo>>(new Map());

// Populate the speakers map from all sessions
agenda.allSessions.forEach(session => {
  session.speakers.forEach(speaker => {
    const existing = speakersMap.value.get(speaker.name);
    if (existing) {
      if (!existing.sessionIds.includes(session.id)) {
        existing.sessionIds.push(session.id);
      }
    } else {
      speakersMap.value.set(speaker.name, {
        name: speaker.name,
        role: speaker.role,
        photoUrl: speaker.photoUrl,
        sessionIds: [session.id]
      });
    }
  });
});

const filteredSpeakers = computed(() => {
  const allSpeakers = Array.from(speakersMap.value.values());
  if (!searchQuery.value) return allSpeakers;
  return allSpeakers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    s.role.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function searchLinkedIn(name: string): void {
  const query = encodeURIComponent(name);
  window.open(`https://www.linkedin.com/search/results/all/?keywords=${query}`, '_blank');
}
</script>

<style scoped>
.speakers-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.speakers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.speakers-header h2 {
  color: #1a1a2e;
}

.search-box {
  width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #0f3460;
}

.speakers-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.all-speakers-section h3 {
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.speakers-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.speaker-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  position: relative;
}

.speaker-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.speaker-card-photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.speaker-card-info {
  flex: 1;
}

.speaker-card-name {
  margin: 0 0 0.25rem;
  color: #1a1a2e;
  font-size: 1rem;
}

.speaker-card-role {
  margin: 0 0 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.speaker-card-sessions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.speaker-session-tag {
  padding: 0.125rem 0.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #333;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linkedin-card-btn {
  padding: 0.375rem 0.625rem;
  background: #0077B5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  flex-shrink: 0;
}

.linkedin-card-btn:hover {
  background: #005885;
  transform: scale(1.1);
}
</style>