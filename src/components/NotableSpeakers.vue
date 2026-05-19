<template>
  <div class="notable-speakers">
    <h2 class="speakers-title">Notable Speakers</h2>
    <div class="speakers-grid">
      <div
        v-for="speaker in notableSpeakers"
        :key="speaker.name"
        class="speaker-card"
        :class="{ active: selectedSpeaker?.name === speaker.name }"
        @click="selectedSpeaker = selectedSpeaker?.name === speaker.name ? null : speaker"
      >
        <img
          v-if="speaker.photoUrl"
          :src="speaker.photoUrl"
          :alt="speaker.name"
          class="speaker-photo"
          loading="lazy"
        />
        <div class="speaker-placeholder" v-else>
          {{ speaker.name.charAt(0) }}
        </div>
        <h3 class="speaker-name">{{ speaker.name }}</h3>
        <p class="speaker-role">{{ speaker.role }}</p>
        <div class="speaker-companies" v-if="speaker.companies?.length">
          <span
            v-for="company in speaker.companies"
            :key="company"
            class="company-tag"
          >
            {{ company }}
          </span>
        </div>
        <div class="speaker-sessions" v-if="speaker.sessions?.length">
          <button class="sessions-toggle" @click.stop="speaker.sessionsExpanded = !speaker.sessionsExpanded">
            {{ speaker.sessionsExpanded ? '▼' : '▶' }} Sessions ({{ speaker.sessions.length }})
          </button>
          <transition name="slide">
            <div v-if="speaker.sessionsExpanded" class="sessions-list">
              <div
                v-for="session in speaker.sessions"
                :key="session.id"
                class="session-item"
                @click="$emit('selectSession', session)"
              >
                <span class="session-time">{{ formatTime(session.time) }}</span>
                <span class="session-title">{{ session.title }}</span>
                <span class="session-location">{{ session.location }}</span>
              </div>
            </div>
          </transition>
        </div>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import agendaData from '../data/agenda.json';

interface SessionSpeaker {
  name: string;
  role: string;
  photoUrl: string;
}

interface Session {
  id: number;
  title: string;
  time: number;
  streamLabel: string;
  location: string;
  speakers: SessionSpeaker[];
}

interface NotableSpeaker {
  name: string;
  role: string;
  photoUrl: string;
  companies: string[];
  sessions: Session[];
  sessionsExpanded: boolean;
}

// Define notable speakers - keynotes, government officials, and frequently appearing speakers
const notableSpeakerNames = [
  'Terry Cornick',           // Festival Director
  'James Muecke',            // Australian of the Year 2020
  'Daniel MacArthur',        // Government/Genomics leader and keynote presenter
  'Sharon Goldfeld AM',      // Prominent keynote presenter, appears across multiple panels
  'Matt Doocey',             // Minister for Mental Health
  'Rachel Green',            // CEO, Mental Health Foundation Australia
  'Professor Cassandra Szoeke', // Prominent academic
  'Noah Szto',               // Award winning Comedian & Doctor of Medicine - comedy performance
  'Professor Nilmini Wickramasinghe', // Professor, Optus Chair Digital Health and keynote presenter
  'Julie McCrossin',         // Journalist, popular public figure, appears across multiple panels
  'Dr Owen Bradfield',       // Chief Medical Officer, Startup Showdown judge
  'Derrick Tin',             // Emergency medicine specialist, AI & cyber sessions
  'Dr Wei Zhou',             // Research Fellow, AI in healthcare
  'Kim Drever',              // Paediatrician & Clinical Advisor, AI Governance track
  'Professor Daniel Capurro', // Professor, Digital Health, Startup Showdown judge
  'Richard Taggart',         // CEO, Digital health consultant
];

const selectedSpeaker = ref<NotableSpeaker | null>(null);
const notableSpeakers = ref<NotableSpeaker[]>([]);

interface CompanyMap {
  [key: string]: string[];
}

const companyMap: CompanyMap = {
  'Royal Children\'s Hospital': ['Royal Children\'s Hospital'],
  'HammondCare': ['HammondCare'],
  'Silverchain': ['Silverchain'],
  'PwC': ['PwC'],
  'Stanford University': ['Stanford University'],
  'Ramsay Health Care': ['Ramsay Health Care'],
  'Bupa': ['Bupa'],
  'NPS MedicineWise': ['NPS MedicineWise'],
  'Mayo Clinic': ['Mayo Clinic'],
  'Medibef': ['Medibef'],
  'HealthGenomics': ['HealthGenomics'],
  'HealthWaive': ['HealthWaive'],
  'Avalera': ['Avalera'],
  'University of Melbourne': ['University of Melbourne'],
  'RMIT University': ['RMIT University'],
  'University of Sydney': ['University of Sydney'],
  'Monash University': ['Monash University'],
  'University of Technology Sydney': ['University of Technology Sydney'],
  'Queensland University of Technology': ['Queensland University of Technology'],
  'Royal College of Physicians UK': ['Royal College of Physicians UK'],
  'Ogilvy': ['Ogilvy'],
};

function formatTime(timeNum: number): string {
  const hours = Math.floor(timeNum / 100);
  const mins = timeNum % 100;
  const period = hours >= 12 ? 'pm' : 'am';
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${h}:${String(mins).padStart(2, '0')}${period}`;
}

function searchLinkedIn(name: string): void {
  const query = encodeURIComponent(name);
  window.open(`https://www.linkedin.com/search/results/all/?keywords=${query}`, '_blank');
}

onMounted(() => {
  const allSessions = [...(agendaData as any).days.flatMap((d: any) => d.sessions), ...(agendaData as any).sessions];
  
  // Build a map from speaker name -> all sessions and best role/photo
  const speakerSessionsMap = new Map<string, Session[]>();
  const speakerInfoMap = new Map<string, { role: string; photoUrl: string }>();
  const speakerCompaniesMap = new Map<string, Set<string>>();

  for (const session of allSessions) {
    for (const speaker of session.speakers) {
      if (notableSpeakerNames.includes(speaker.name)) {
        // Accumulate sessions
        if (!speakerSessionsMap.has(speaker.name)) {
          speakerSessionsMap.set(speaker.name, []);
        }
        speakerSessionsMap.get(speaker.name)!.push(session as Session);

        // Keep the first info (photo, role)
        if (!speakerInfoMap.has(speaker.name)) {
          speakerInfoMap.set(speaker.name, { role: speaker.role, photoUrl: speaker.photoUrl });
        }

        // Extract companies from this session's full speaker list
        if (!speakerCompaniesMap.has(speaker.name)) {
          speakerCompaniesMap.set(speaker.name, new Set());
        }
        const compSet = speakerCompaniesMap.get(speaker.name)!;
        for (const s of session.speakers) {
          for (const [keyword, foundCompanies] of Object.entries(companyMap)) {
            if (s.name.includes(keyword) || s.role.includes(keyword)) {
              for (const c of foundCompanies) compSet.add(c);
            }
          }
        }
      }
    }
  }

  notableSpeakers.value = Array.from(speakerSessionsMap.entries()).map(([name, sessions]) => {
    const info = speakerInfoMap.get(name)!;
    const companies = [...(speakerCompaniesMap.get(name) || new Set())];
    return {
      name,
      role: info.role,
      photoUrl: info.photoUrl,
      companies,
      sessions: sessions.sort((a: Session, b: Session) => a.time - b.time),
      sessionsExpanded: false,
    };
  });
});

defineEmits<{
  (e: 'selectSession', session: Session): void;
}>();
</script>

<style scoped>
.notable-speakers {
  max-width: 1400px;
  margin: 0 auto;
}

.speakers-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
  text-align: center;
}

.speakers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
  padding-bottom: 2rem;
}

.speaker-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.speaker-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.speaker-card.active {
  border-color: #e94560;
  background: #fff5f7;
}

.speaker-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e94560;
  margin-bottom: 0.75rem;
}

.speaker-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0f3460, #e94560);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.speaker-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0.5rem 0 0.25rem;
  text-align: center;
}

.speaker-role {
  color: #666;
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  text-align: center;
}

.speaker-companies {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.company-tag {
  background: #f0f4f8;
  color: #333;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.sessions-toggle {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #333;
  font-weight: 500;
  margin-top: 0.5rem;
  transition: all 0.2s;
}

.sessions-toggle:hover {
  background: #e9ecef;
}

.sessions-list {
  margin-top: 0.75rem;
  width: 100%;
}

.session-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.session-item:hover {
  border-color: #0f3460;
  background: #f8f9fa;
}

.session-time {
  font-weight: 600;
  color: #e94560;
  font-size: 0.8rem;
  display: block;
  margin-bottom: 0.25rem;
}

.session-title {
  color: #1a1a2e;
  font-size: 0.875rem;
  font-weight: 500;
  display: block;
  margin-bottom: 0.25rem;
}

.session-location {
  color: #666;
  font-size: 0.75rem;
  display: block;
}

.linkedin-btn {
  margin-top: 0.75rem;
  padding: 0.375rem 0.75rem;
  background: #0077B5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  align-self: center;
}

.linkedin-btn:hover {
  background: #005885;
  transform: scale(1.05);
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .speakers-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .speaker-card {
    padding: 1.25rem;
  }
  
  .speaker-photo,
  .speaker-placeholder {
    width: 80px;
    height: 80px;
    font-size: 2rem;
  }
}
</style>