export interface Speaker {
  name: string
  role: string
  photoUrl: string
}

export interface Session {
  id: number
  day: number
  time: number
  startTime: string
  title: string
  stream: string
  streamLabel: string
  speakers: Speaker[]
  description: string
  location: string
}

export interface Stream {
  key: string
  color: string
  label: string
}

export interface Day {
  label: string
  date: string
  sessions: Session[]
}

export interface Event {
  title: string
  dates: string
  location: string
}

export interface AgendaData {
  event: Event
  streams: Stream[]
  days: Day[]
  sessions: Session[]
}