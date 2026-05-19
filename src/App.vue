<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">{{ agenda.eventData.title }}</h1>
        <p class="app-subtitle">{{ agenda.eventData.dates }} · {{ agenda.eventData.location }}</p>
      </div>
      <div class="header-controls">
        <div class="day-selector">
          <button v-for="day in agenda.days" :key="day.no" class="day-btn" :class="{ active: agenda.selectedDay === day.no }" @click="agenda.selectDay(day.no)">
            {{ day.label }}
          </button>
        </div>
        <SearchResults :all-sessions="agenda.allSessions" :favorites="agenda.favorites" :streams="agenda.streams" @update-query="agenda.setSearchQuery" @select-session="agenda.selectSession" @toggle-favorite="agenda.toggleFavorite" />
        <nav class="route-nav">
          <router-link v-for="route in navRoutes" :key="route.path" :to="route.path" class="nav-btn" :class="{ active: $route.path === route.path }">
            <span class="nav-icon">{{ route.icon }}</span>
            <span class="nav-label">{{ route.label }}</span>
          </router-link>
        </nav>
        <button class="fav-filter-btn" :class="{ active: agenda.favoritesOnly }" @click="agenda.toggleFavoritesFilter">Favorites</button>
        <button class="sync-btn" @click="openSyncModal">Sync</button>
      </div>
    </header>
    <div class="streams-bar">
      <span class="streams-label">Streams:</span>
      <button v-for="stream in agenda.streams" :key="stream.key" class="stream-btn" :class="{ active: agenda.selectedStreams.includes(stream.key) }" :style="{ borderColor: stream.color }" @click="agenda.toggleStream(stream.key)">
        <span class="stream-dot" :style="{ backgroundColor: stream.color }"></span>
        {{ stream.label }} ({{ agenda.allSessions.filter(s => s.stream === stream.key).length }})
      </button>
    </div>
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <Transition>
      <div v-if="agenda.selectedSession" class="session-overlay" @click="agenda.selectSession(agenda.selectedSession)">
        <div class="session-detail" @click.stop>
          <button class="close-btn" @click="agenda.selectSession(agenda.selectedSession)">×</button>
          <div class="detail-header">
            <span class="stream-tag large" :style="{ backgroundColor: agenda.getStreamColor(agenda.selectedSession.stream) }">{{ agenda.selectedSession.streamLabel }}</span>
            <button class="fav-btn large" :class="{ active: agenda.isFavorite(agenda.selectedSession.id) }" @click="agenda.toggleFavorite(agenda.selectedSession.id)">{{ agenda.isFavorite(agenda.selectedSession.id) ? '\u2605' : '\u2606' }}</button>
          </div>
          <h2 class="detail-title">{{ agenda.selectedSession.title }}</h2>
          <p class="detail-time">{{ formatTime(agenda.selectedSession.time) }} · {{ agenda.selectedSession.location }}</p>
          <div class="detail-speakers">
            <h3>Speakers</h3>
            <div v-for="speaker in agenda.selectedSession.speakers" :key="speaker.name" class="speaker-detail">
              <img v-if="speaker.photoUrl" :src="speaker.photoUrl" :alt="speaker.name" class="speaker-photo large" />
              <div>
                <div class="speaker-name">{{ speaker.name }}</div>
                <div class="speaker-role">{{ speaker.role }}</div>
                <button class="linkedin-btn" :title="'Search ' + speaker.name + ' on LinkedIn'" @click.stop="searchLinkedIn(speaker.name)">in</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <Transition>
      <div v-if="showSyncModal" class="sync-overlay" @click="showSyncModal = false">
        <div class="sync-modal" @click.stop>
          <button class="close-btn" @click="showSyncModal = false">×</button>
          <h2 class="sync-title">Sync Favorites</h2>
          <p class="sync-desc">Copy this data and paste it on another device to sync your favorites:</p>
          <div class="sync-section">
            <label class="sync-label">Your Sync Data (copy this):</label>
            <textarea v-model="exportText" class="sync-textarea" readonly @focus="$event.target.select()"></textarea>
            <button class="copy-btn" @click="copySyncData">Copy</button>
            <span v-if="syncStatus === 'copied'" class="sync-status success">\u2713 Copied!</span>
          </div>
          <div class="sync-divider"></div>
          <div class="sync-section">
            <label class="sync-label">Paste data from another device:</label>
            <textarea v-model="importText" class="sync-textarea" placeholder="Paste sync data here..."></textarea>
            <button class="import-btn" @click="importSyncData">Import Favorites</button>
            <span v-if="syncStatus === 'imported'" class="sync-status success">\u2713 Imported!</span>
            <span v-if="syncStatus === 'error'" class="sync-status error">Invalid data format</span>
          </div>
          <div class="sync-device-id"><small>Device ID: {{ agenda.deviceId }}</small></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useAgendaStore } from './store/agenda';
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import SearchResults from './components/SearchResults.vue';

const agenda = useAgendaStore();
const route = useRoute();
const showSyncModal = ref(false);
const exportText = ref('');
const importText = ref('');
const syncStatus = ref<'copied' | 'imported' | 'error' | null>(null);

const navRoutes = [
  { path: '/timeline', label: 'Timeline', icon: '\u23F1\uFE0F' },
  { path: '/grid', label: 'Grid', icon: '\uD83D\uDCCA' },
  { path: '/days', label: 'Days', icon: '\uD83D\uDDD5\uFE0F' },
  { path: '/speakers', label: 'Speakers', icon: '\uD83C\uDFA4' },
  { path: '/favourites', label: 'Favourites', icon: '\u2605' }
];

function openSyncModal() {
  showSyncModal.value = true;
  syncStatus.value = null;
  exportText.value = agenda.getExportData();
  importText.value = '';
}

function copySyncData() {
  navigator.clipboard.writeText(exportText.value).then(() => {
    syncStatus.value = 'copied';
    setTimeout(() => { syncStatus.value = null; }, 2000);
  });
}

function importSyncData() {
  if (!importText.value.trim()) { syncStatus.value = 'error'; return; }
  if (agenda.importData(importText.value)) {
    syncStatus.value = 'imported';
    setTimeout(() => { showSyncModal.value = false; syncStatus.value = null; }, 1500);
  } else { syncStatus.value = 'error'; }
}

let timeInterval: ReturnType<typeof setInterval> | null = null;
onMounted(() => { timeInterval = setInterval(() => {}, 60000); });
onUnmounted(() => { if (timeInterval) clearInterval(timeInterval); });

function searchLinkedIn(name: string): void {
  window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(name)}`, '_blank');
}

function formatTime(timeNum: number): string {
  const h = Math.floor(timeNum / 100);
  const m = timeNum % 100;
  const p = h >= 12 ? 'pm' : 'am';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')}${p}`;
}
</script>

<style scoped>
.app-header { background: #1a1a2e; color: white; padding: 1rem 2rem; border-bottom: 3px solid #e94560; }
.header-content h1 { margin: 0; font-size: 2rem; font-weight: 700; }
.header-content p { margin: 0.25rem 0 0; opacity: 0.8; }
.header-controls { display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; align-items: center; }
.day-selector { display: flex; gap: 0.25rem; }
.day-btn { padding: 0.5rem 1rem; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: white; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
.day-btn.active, .day-btn:hover { background: #e94560; border-color: #e94560; }
.route-nav { display: flex; gap: 0.25rem; }
.nav-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: white; border-radius: 4px; cursor: pointer; transition: all 0.2s; text-decoration: none; font-size: 0.875rem; }
.nav-btn:hover { background: rgba(255,255,255,0.1); }
.nav-btn.active { background: #0f3460; border-color: #0f3460; }
.nav-icon { font-size: 1rem; }
.nav-label { font-weight: 500; }
.fav-filter-btn { padding: 0.5rem 1rem; border: 2px solid #ffc107; background: transparent; color: #ffc107; border-radius: 4px; cursor: pointer; font-weight: 500; }
.fav-filter-btn.active { background: #ffc107; color: #1a1a2e; }
.sync-btn { padding: 0.5rem 1rem; border: 2px solid #0f3460; background: transparent; color: #0f3460; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.sync-btn:hover { background: #0f3460; color: white; }
.streams-bar { display: flex; gap: 0.5rem; padding: 0.75rem 2rem; background: #f8f9fa; border-bottom: 1px solid #dee2e6; flex-wrap: wrap; align-items: center; }
.streams-label { font-weight: 600; margin-right: 0.5rem; }
.stream-btn { padding: 0.375rem 0.75rem; border: 2px solid; background: white; border-radius: 20px; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; opacity: 0.7; }
.stream-btn.active { opacity: 1; font-weight: 600; }
.stream-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
.main-content { height: calc(100vh - 180px); overflow-y: auto; padding: 1rem; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.session-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.session-detail { background: white; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative; }
.close-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.stream-tag { padding: 0.25rem 0.5rem; border-radius: 4px; color: white; font-size: 0.75rem; font-weight: 600; }
.stream-tag.large { padding: 0.5rem 1rem; font-size: 0.875rem; }
.fav-btn { background: none; border: 1px solid #ddd; cursor: pointer; color: #999; font-size: 1rem; padding: 0.25rem 0.5rem; border-radius: 4px; transition: all 0.2s; }
.fav-btn.active { color: #ffc107; border-color: #ffc107; background: #fffdf0; }
.fav-btn.large { font-size: 1.5rem; padding: 0.5rem 0.75rem; }
.detail-title { margin: 0; font-size: 1.5rem; color: #1a1a2e; }
.detail-time { color: #666; margin: 0.5rem 0 1rem; }
.detail-speakers h3 { margin: 1rem 0 0.5rem; }
.speaker-detail { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; }
.speaker-photo.large { width: 40px; height: 40px; }
.speaker-detail .speaker-name { font-weight: 600; font-size: 0.9rem; color: #1a1a2e; }
.speaker-detail .speaker-role { color: #666; font-size: 0.8rem; }
.session-detail .linkedin-btn { margin-top: 0.25rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; }
.sync-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.sync-modal { background: white; border-radius: 12px; padding: 2rem; max-width: 600px; width: 90%; max-height: 85vh; overflow-y: auto; position: relative; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.sync-title { margin: 0 0 0.5rem; font-size: 1.5rem; color: #1a1a2e; padding-right: 2rem; }
.sync-desc { color: #666; margin-bottom: 1.5rem; }
.sync-section { margin-bottom: 1rem; }
.sync-label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333; }
.sync-textarea { width: 100%; min-height: 80px; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 8px; font-family: monospace; font-size: 0.75rem; resize: vertical; transition: border-color 0.2s; box-sizing: border-box; }
.sync-textarea:focus { outline: none; border-color: #0f3460; background: #f8f9fa; }
.sync-textarea[readonly] { background: #f8f9fa; color: #333; }
.copy-btn, .import-btn { margin-top: 0.5rem; padding: 0.5rem 1.25rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; }
.copy-btn { background: #0f3460; color: white; }
.copy-btn:hover { background: #1a4a8a; }
.import-btn { background: #e94560; color: white; }
.import-btn:hover { background: #ff6b81; }
.sync-status { display: inline-block; margin-left: 0.75rem; font-size: 0.875rem; font-weight: 500; }
.sync-status.success { color: #28a745; }
.sync-status.error { color: #dc3545; }
.sync-divider { height: 1px; background: #dee2e6; margin: 1.5rem 0; }
.sync-device-id { margin-top: 1.5rem; text-align: center; color: #999; }
.sync-device-id small { font-family: monospace; }
.v-enter-active, .v-leave-active { transition: opacity 0.2s ease; }
.v-enter-from, .v-leave-to { opacity: 0; }
.v-enter-active .session-detail, .v-leave-active .session-detail { transition: transform 0.2s ease; }
.v-enter-from .session-detail, .v-leave-to .session-detail { transform: scale(0.95); }
</style>