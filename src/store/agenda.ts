import { defineStore } from 'pinia'
import agendaData from '../data/agenda.json'
import type { Session, Stream } from '../types'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'

// Storage key for cross-device sync
const DEVICE_ID_STORAGE_KEY = 'dhf2026_device_id'

// Generate or retrieve a unique device ID for sync purposes
function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId)
  }
  return deviceId
}

interface DayInfo {
  no: number
  label: string
  date: string
}

interface EventData {
  title: string
  dates: string
  location: string
}

interface StoreState {
  eventData: EventData
  streams: Stream[]
  days: DayInfo[]
  allSessions: Session[]
  favorites: number[]
  favoritesOnly: boolean
  selectedDay: number
  selectedStreams: string[]
  searchQuery: string
  viewMode: 'timeline' | 'grid'
  selectedSession: Session | null
}

export const useAgendaStore = defineStore('agenda', () => {
  // Get device ID for sync
  const deviceId = getDeviceId()

  // State
  const eventData = ref<EventData>({
    title: 'Digital Health Festival 2026',
    dates: '20 - 21 May 2026',
    location: 'Melbourne Convention Centre',
  })
  const streams = ref<Stream[]>(agendaData.streams)
  const days = ref<DayInfo[]>([
    { no: 1, label: 'May 20 2026', date: 'Tuesday 20 May 2026' },
    { no: 2, label: 'May 21 2026', date: 'Wednesday 21 May 2026' },
  ])
  const allSessions = ref<Session[]>(agendaData.sessions)
  // Use useLocalStorage for persistent favorites that survive HMR rebuilds
  const favorites = useLocalStorage<number[]>('dhf2026_favorites', [])
  const favoritesOnly = ref<boolean>(false)
  const selectedDay = ref<number>(1)
  const selectedStreams = ref<string[]>([...streams.value.map((s: Stream) => s.key)])
  const searchQuery = ref<string>('')
  const viewMode = ref<'timeline' | 'grid'>('timeline')
  const selectedSession = ref<Session | null>(null)

  // Getters
  const activeStreams = computed(() =>
    streams.value.filter((s: Stream) => selectedStreams.value.includes(s.key))
  )

  const filteredSessions = computed<Session[]>(() => {
    let sessions = allSessions.value

    if (selectedDay.value) {
      sessions = sessions.filter((s: Session) => s.day === selectedDay.value)
    }

    sessions = sessions.filter((s: Session) => selectedStreams.value.includes(s.stream))

    if (favoritesOnly.value) {
      sessions = sessions.filter((s: Session) => favorites.value.includes(s.id))
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      sessions = sessions.filter(
        (s: Session) =>
          s.title.toLowerCase().includes(q) ||
          s.speakers.some((sp) => sp.name.toLowerCase().includes(q)) ||
          s.speakers.some((sp) => sp.role.toLowerCase().includes(q)) ||
          s.location.toLowerCase().includes(q)
      )
    }

    return sessions.sort((a: Session, b: Session) => a.time - b.time)
  })

  const currentHours = computed<number[]>(() => {
    const sessions = filteredSessions.value
    if (sessions.length === 0) return []
    const hourMap = new Map<number, number>()
    sessions.forEach((s: Session) => {
      const h = Math.floor(s.time / 100)
      if (!hourMap.has(h)) hourMap.set(h, h)
    })
    return Array.from(hourMap.keys()).sort((a: number, b: number) => a - b)
  })

  // Actions
  function toggleFavorite(sessionId: number): void {
    const idx = favorites.value.indexOf(sessionId)
    if (idx >= 0) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push(sessionId)
    }
  }

  // Export/import functions for cross-device sync
  function getExportData(): string {
    // Return JSON with favorites and device ID for sharing
    const data = {
      version: 1,
      deviceId: deviceId,
      favorites: favorites.value,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data)
  }

  function importData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr)
      if (data.version === 1 && Array.isArray(data.favorites)) {
        favorites.value = data.favorites
        return true
      }
      return false
    } catch (e) {
      console.warn('Failed to import favorites:', e)
      return false
    }
  }

  function isFavorite(sessionId: number): boolean {
    return favorites.value.includes(sessionId)
  }

  function selectSession(session: Session | null): void {
    if (session && selectedSession.value?.id === session.id) {
      selectedSession.value = null
    } else {
      selectedSession.value = session
    }
  }

  function toggleStream(streamKey: string): void {
    const idx = selectedStreams.value.indexOf(streamKey)
    if (idx >= 0) {
      selectedStreams.value.splice(idx, 1)
    } else {
      selectedStreams.value.push(streamKey)
    }
  }

  function selectDay(dayNum: number): void {
    selectedDay.value = dayNum
  }

  function switchView(mode: 'timeline' | 'grid'): void {
    viewMode.value = mode
  }

  function toggleFavoritesFilter(): void {
    favoritesOnly.value = !favoritesOnly.value
  }

  function setSearchQuery(query: string): void {
    searchQuery.value = query
  }

  function formatTime(timeNum: number): string {
    const hours = Math.floor(timeNum / 100)
    const mins = timeNum % 100
    const period = hours >= 12 ? 'pm' : 'am'
    const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${h}:${String(mins).padStart(2, '0')}${period}`
  }

  function getStreamColor(streamKey: string): string {
    const stream = streams.value.find((s: Stream) => s.key === streamKey)
    return stream?.color || '#9e9e9e'
  }

  function groupSessionsByHour(sessions: Session[]): Record<number, Session[]> {
    const grouped: Record<number, Session[]> = {}
    sessions.forEach((s: Session) => {
      const hour = Math.floor(s.time / 100)
      if (!grouped[hour]) grouped[hour] = []
      grouped[hour].push(s)
    })
    return grouped
  }

  return {
    eventData,
    streams,
    days,
    allSessions,
    favorites,
    favoritesOnly,
    selectedDay,
    selectedStreams,
    searchQuery,
    viewMode,
    selectedSession,
    activeStreams,
    filteredSessions,
    currentHours,
    deviceId,
    toggleFavorite,
    isFavorite,
    selectSession,
    toggleStream,
    selectDay,
    switchView,
    toggleFavoritesFilter,
    setSearchQuery,
    formatTime,
    getStreamColor,
    groupSessionsByHour,
    getExportData,
    importData,
  }
})