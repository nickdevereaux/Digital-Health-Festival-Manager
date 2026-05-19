import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { JSDOM } from 'jsdom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Speaker {
  name: string
  role: string
  photoUrl: string
}

interface Session {
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

interface StreamInfo {
  key: string
  color: string
  label: string
}

interface DayData {
  label: string
  date: string
  sessions: Session[]
}

interface Stats {
  totalSessions: number
  dayCounts: {
    day1: number
    day2: number
  }
  streamCounts: StreamInfo & { count: number }[]
}

interface AgendaOutput {
  event: {
    title: string
    dates: string
    location: string
  }
  streams: StreamInfo[]
  days: DayData[]
  sessions: Session[]
  stats: Stats
}

const STREAM_COLORS: Record<string, string> = {
  Plenary: '#607d8b',
  Astra: '#2196f3',
  Gravity: '#9c27b0',
  Cosmo: '#ff9800',
  Galaxy: '#e91e63',
  Eclipse: '#795548',
  Luna: '#4caf50',
  Quest: '#f57c00',
  Nebula: '#00bcd4',
  Voyager: '#3f51b5',
  Apollo: '#ffeb3b',
}

// Helper: convert time string like "9:00am" to a number like 900
function timeToNum(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i)
  if (!match) return 0
  let hours = parseInt(match[1])
  const mins = match[2]
  const meridian = match[3].toLowerCase()
  if (meridian === 'pm' && hours !== 12) hours += 12
  if (meridian === 'am' && hours === 12) hours = 0
  return parseInt(`${String(hours).padStart(2, '0')}${mins}`)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Find all ASession rows (the actual session entries)
const sourcePath = join(__dirname, 'source.html')
const html = readFileSync(sourcePath, 'utf-8')

const dummyWindow = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>').window
const DOMParser = dummyWindow.DOMParser.bind(dummyWindow)

const doc = new DOMParser().parseFromString(html, 'text/html')

// Stream colors
const sessionRows = Array.from(doc.querySelectorAll('.ASession'))
console.log(`Found ${sessionRows.length} session rows (ASession)`)

const allSessions: Session[] = []
let sessionId = 1

for (const row of sessionRows) {
  const className = row.className || ''

  // Extract stream from class (stream_astra, stream_eclipse, etc.)
  const streamMatch = className.match(/stream_(\w+)/i)
  const streamKey = streamMatch ? streamMatch[1].toLowerCase() : 'general'

  // Extract time from class (time_0900, time_0915, etc.)
  const timeMatch = className.match(/time_(\d{4})/i)
  const timeNum = timeMatch ? parseInt(timeMatch[1]) : 0

  // Skip null sessions / breaks
  if (className.includes('null') || className.includes('break')) continue
  if (!timeNum) continue

  // Get title from H4
  const titleEl = row.querySelector('h4')
  let title = ''
  if (titleEl) {
    title = titleEl.textContent.trim().replace(/[\s\n]+/g, ' ').trim()
  }
  if (!title || title.length < 5) continue

  // Get location/venue
  const locEl = row.querySelector('.Location')
  let location = 'TBC'
  if (locEl) {
    location = locEl.textContent.trim().replace(/[\s\n]+/g, ' ').trim()
  }

  // Get speakers with photos - deduplicate within a single row
  const speakers: Speaker[] = []
  const seenSpeakerNames = new Set<string>()
  const speakerBlocks = row.querySelectorAll('.Speaker')

  for (const sp of speakerBlocks) {
    const nameEl = sp.querySelector('[class*="Name"]')
    const roleEl = sp.querySelector('.Jobtitle')
    const photoImg = sp.querySelector('img')

    let name = ''
    let role = ''
    let photoUrl = ''

    if (nameEl) {
      name = nameEl.textContent.trim().replace(/[,\s\n]+/g, ' ').trim()
    }

    // Fallback: get name from any text node that isn't a role/title
    if (!name) {
      for (const child of sp.childNodes) {
        if (child.nodeType === dummyWindow.Node.TEXT_NODE) {
          const t = child.textContent.trim().replace(/[,\s\n]+/g, ' ').trim()
          if (t && t.length > 2 && !t.toLowerCase().match(/pharmd|phd|mbbs|md|executive|senior|director|prof|head of|vice|dean|chair|consultant|founder|co-founder|ceo|cto|cmo|cdo|cbo|cio|cfo/gi)) {
            name = t
            break
          }
        }
      }
    }

    if (roleEl) {
      role = roleEl.textContent.trim().replace(/[,\s\n]+/g, ' ').trim()
    }
    if (photoImg && photoImg.getAttribute('src')) {
      photoUrl = photoImg.getAttribute('src') || ''
    }

    if (name && !seenSpeakerNames.has(name)) {
      seenSpeakerNames.add(name)
      speakers.push({ name, role, photoUrl })
    }
  }

  // Get session day from TimeDate span
  const timeDateEl = row.querySelector('.TimeDate')
  let day = 1
  if (timeDateEl) {
    const dateText = timeDateEl.textContent.trim()
    day = dateText.includes('21') ? 2 : 1
  }

  allSessions.push({
    id: sessionId++,
    day,
    time: timeNum,
    startTime: `${String(Math.floor(timeNum / 100)).padStart(2, '0')}:${String(timeNum % 100).padStart(2, '0')}`,
    title,
    stream: streamKey,
    streamLabel: capitalize(streamKey),
    speakers,
    description: '',
    location,
  })
}

// Sort by day then time
allSessions.sort((a: Session, b: Session) => {
  if (a.day !== b.day) return a.day - b.day
  return a.time - b.time
})

// Build streams list
const activeStreams = [...new Set(allSessions.map((s: Session) => s.stream))]

// Build output
const output: AgendaOutput = {
  event: {
    title: 'Digital Health Festival 2026',
    dates: '20 - 21 May 2026',
    location: 'Melbourne Convention Centre',
  },
  streams: Object.entries(STREAM_COLORS)
    .map(([key, color]) => ({ key: key.toLowerCase(), color, label: key }))
    .filter((s: StreamInfo) => activeStreams.includes(s.key)),
  days: [
    {
      label: 'May 20 2026',
      date: 'Tuesday 20 May 2026',
      sessions: allSessions.filter((s: Session) => s.day === 1).sort((a: Session, b: Session) => a.time - b.time),
    },
    {
      label: 'May 21 2026',
      date: 'Wednesday 21 May 2026',
      sessions: allSessions.filter((s: Session) => s.day === 2).sort((a: Session, b: Session) => a.time - b.time),
    },
  ],
  sessions: allSessions,
  stats: {
    totalSessions: allSessions.length,
    dayCounts: {
      day1: allSessions.filter((s: Session) => s.day === 1).length,
      day2: allSessions.filter((s: Session) => s.day === 2).length,
    },
    streamCounts: Object.entries(STREAM_COLORS)
      .map(([key, color]) => ({
        stream: key.toLowerCase(),
        label: key,
        count: allSessions.filter((s: Session) => s.stream === key.toLowerCase()).length,
      }))
      .filter((s: StreamInfo & { count: number }) => s.count > 0) as (StreamInfo & { count: number })[],
  },
}

// Write output
const outDir = join(__dirname, 'src', 'data')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'agenda.json'), JSON.stringify(output, null, 2), 'utf-8')

console.log('\nAgenda extracted successfully!')
console.log(`  Total sessions: ${output.stats.totalSessions}`)
console.log(`  Day 1 (May 20): ${output.stats.dayCounts.day1} sessions`)
console.log(`  Day 2 (May 21): ${output.stats.dayCounts.day2} sessions`)
console.log(`  Streams: ${output.streams.map((s: StreamInfo) => `${s.label}`).join(', ')}`)
console.log(`\nFirst 10 sessions:`)
allSessions.slice(0, 10).forEach((s: Session) => {
  console.log(`  [Day ${s.day}] ${s.startTime} - ${s.title} [${s.streamLabel}] @ ${s.location}${s.speakers.length ? ` w/ ${s.speakers.map(sp => sp.name).join(', ')}` : ''}`)
})
console.log(`\nOutput written to src/data/agenda.json`)