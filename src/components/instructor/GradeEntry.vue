<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import GradeEntryTable from '@/components/grades/GradeEntryTable.vue'
import api from '@/api/axios'

interface Student       { id: number; name: string }
interface GradeComponent { id: number; name?: string; type: string; raw_max: number }

interface GradeApiRow {
  student_id:          number
  student_name?:       string
  raw_score:           number | null
  raw_max?:            number
  course_component_id?: number
  course_component?: {
    id?:     number
    type?:   string
    course?: { name?: string }
  }
}

const MOCK_STUDENTS: Student[] = [
  { id: 101, name: 'Ahmed Hassan'   },
  { id: 102, name: 'Sara Mahmoud'   },
  { id: 103, name: 'Mahmoud Fathy'  },
  { id: 104, name: 'Malak Essam'    },
]

const MOCK_COMPONENTS: GradeComponent[] = [
  { id: 1, name: 'Lab Deliverable', type: 'lab_deliverable', raw_max: 100 },
  { id: 2, name: 'Final Exam',      type: 'final_exam',      raw_max: 50  },
]

const MOCK_SCORES: Record<string, number | null> = {
  '101_1': 87, '101_2': 41,
  '102_1': 93, '102_2': null,
  '103_1': null, '103_2': 38,
  '104_1': 76, '104_2': 44,
}

const isLoading  = ref(true)
const students   = ref<Student[]>([])
const components = ref<GradeComponent[]>([])
const scores = ref<Record<string, number | null>>({})
const isSaving   = ref(false)
const saveMsg    = ref<string | null>(null)

const isModalOpen = ref(false)
const activeStudentId = ref<number | null>(null)
const activeCompId = ref<number | null>(null)
const overrideScore = ref<number>(0)
const instructorNotes = ref('')
const noteError = ref(false)

async function load() {
  isLoading.value = true
  try {
    const res = await api.get('/v1/grades')
    const data: GradeApiRow[] = res.data?.data ?? []

    if (data.length === 0) {
      students.value   = MOCK_STUDENTS
      components.value = MOCK_COMPONENTS
      scores.value     = { ...MOCK_SCORES }
      return
    }

    const studentMap   = new Map<number, Student>()
    const componentMap = new Map<number, GradeComponent>()
    const scoreMap: Record<string, number | null> = {}

    for (const g of data) {
      if (!studentMap.has(g.student_id)) {
        studentMap.set(g.student_id, {
          id:   g.student_id,
          name: g.student_name ?? `Student #${g.student_id}`,
        })
      }
      const cId = g.course_component?.id ?? g.course_component_id
      if (cId !== undefined && !componentMap.has(cId)) {
        componentMap.set(cId, {
          id:      cId,
          name:    g.course_component?.course?.name,
          type:    g.course_component?.type ?? 'component',
          raw_max: g.raw_max ?? 100,
        })
      }
      if (cId !== undefined) {
        scoreMap[`${g.student_id}_${cId}`] = g.raw_score ?? null
      }
    }

    students.value   = Array.from(studentMap.values())
    components.value = Array.from(componentMap.values())
    scores.value     = scoreMap
  } catch {
    students.value   = MOCK_STUDENTS
    components.value = MOCK_COMPONENTS
    scores.value     = { ...MOCK_SCORES }
  } finally {
    isLoading.value = false
  }
}

function openOverride(studentId: number | undefined, compId: number | undefined) {
  if (studentId === undefined || compId === undefined) return
  activeStudentId.value = studentId
  activeCompId.value = compId
  const current = scores.value[`${studentId}_${compId}`]
 overrideScore.value = current ?? 0
  instructorNotes.value = ''
  noteError.value = false
  isModalOpen.value = true
}

function confirmOverride() {
  if (!instructorNotes.value || !instructorNotes.value.trim()) {
    noteError.value = true
    return
  }
  if (activeStudentId.value !== null && activeCompId.value !== null) {
    scores.value[`${activeStudentId.value}_${activeCompId.value}`] = overrideScore.value
  }
  isModalOpen.value = false
}

async function save() {
  isSaving.value = true
  saveMsg.value  = null
  try {
    const payload = Object.entries(scores.value)
      .filter(([, v]) => v !== null)
      .map(([key, raw_score]) => {
        const [student_id, component_id] = key.split('_').map(Number)
        return { student_id, component_id, raw_score }
      })
    await api.post('/v1/grades/batch', { grades: payload })
    saveMsg.value = 'Scores saved successfully.'
  } catch {
    saveMsg.value = 'Save failed — scores are shown locally only.'
  } finally {
    isSaving.value = false
    setTimeout(() => { saveMsg.value = null }, 4000)
  }
}

const hasChanges = computed(() =>
  Object.values(scores.value).some(v => v !== null)
)

const activeTargetInfo = computed(() => {
  if (activeStudentId.value === null || activeCompId.value === null) return null
  const s = students.value.find(st => st.id === activeStudentId.value)
  const c = components.value.find(co => co.id === activeCompId.value)
  return { studentName: s?.name ?? 'Student', compName: c?.name ?? 'Component', max: c?.raw_max ?? 100 }
})

function triggerFirstAudit() {
  const firstStudent = students.value[0]
  const firstComp = components.value[0]
  if (firstStudent && firstComp) {
    openOverride(firstStudent.id, firstComp.id)
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-[#E6DDD4] text-[#1b1b1b] font-sans pb-16 p-6">

    <div class="mb-10">
      <span class="font-sans text-[11px] font-bold text-[#4c4546] uppercase tracking-[1.5px] mb-1 block">Instructor Panel</span>
      <h1 class="font-serif text-[36px] text-[#1b1b1b] leading-tight font-medium">Grade Entry Matrix</h1>
      <div class="h-px bg-[#C9BDB8] w-full mt-4"></div>
    </div>

    <div v-if="isLoading" class="bg-white border border-[#C9BDB8] rounded-[10px] p-12 flex items-center justify-center gap-3 shadow-sm">
      <div class="w-5 h-5 border-2 border-[#C9BDB8] border-t-[#940002] rounded-full animate-spin" />
      <span class="font-sans text-sm text-[#4c4546] font-medium">Loading secure grade matrix…</span>
    </div>

    <template v-else>
      <div class="mb-4 text-right">
        <p class="text-xs text-[#4c4546] italic">Tip: Click on rows inside spreadsheet to manage precise scoring updates.</p>
      </div>

      <GradeEntryTable
        :students="students"
        :components="components"
        v-model="scores"
      />

      <div class="mt-6 flex items-center justify-between">
        <Transition name="fade">
          <p
            v-if="saveMsg"
            class="font-sans text-xs font-bold uppercase tracking-[0.5px]"
            :class="saveMsg.includes('failed') ? 'text-[#ba1a1a]' : 'text-green-700'"
          >
            {{ saveMsg }}
          </p>
          <span v-else />
        </Transition>

        <div class="flex gap-4">
          <button
            v-if="hasChanges"
            type="button"
            @click="triggerFirstAudit"
            class="h-11 px-6 rounded-[6px] border border-[#940002] text-[#940002] font-sans text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#940002]/5 transition-all"
          >
            Audit Selection
          </button>

          <button
            type="button"
            :disabled="!hasChanges || isSaving"
            class="h-11 px-8 rounded-[6px] font-sans text-[11px] font-bold uppercase tracking-[1px] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            :class="hasChanges && !isSaving
              ? 'bg-[#940002] text-white hover:opacity-90'
              : 'bg-gray-200 text-gray-400'"
            @click="save"
          >
            {{ isSaving ? 'Synchronizing…' : 'Save Scores' }}
          </button>
        </div>
      </div>
    </template>

    <Transition name="modal-fade">
      <div v-if="isModalOpen && activeTargetInfo" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#1b1b1b]/40 backdrop-blur-sm" @click="isModalOpen = false"></div>

        <div class="bg-white w-full max-w-[450px] rounded-[12px] border border-[#940002] shadow-2xl overflow-hidden relative z-10 p-6">
          <h3 class="font-serif text-[22px] text-[#1b1b1b] mb-4">Grade Override Audit</h3>

          <div class="space-y-4 font-sans">
            <div class="p-3 bg-[#F5EDEA]/40 rounded-lg border border-[#C9BDB8]/30 text-xs">
              <p><span class="font-bold">Student:</span> {{ activeTargetInfo.studentName }}</p>
              <p class="mt-1"><span class="font-bold">Target Component:</span> {{ activeTargetInfo.compName }}</p>
            </div>

            <div>
              <label class="block text-[11px] font-bold mb-1.5 text-[#1b1b1b] uppercase">Override Score</label>
              <input
                type="number"
                v-model.number="overrideScore"
                :max="activeTargetInfo.max"
                min="0"
                class="w-full border border-[#C9BDB8] rounded-[6px] p-2 text-sm focus:ring-0 focus:border-[#940002] font-mono"
              />
              <span class="text-[10px] text-[#4c4546] opacity-60 mt-1 block">Maximum allowed: {{ activeTargetInfo.max }} pts</span>
            </div>

            <div>
              <label class="block text-[11px] font-bold mb-1.5 text-[#1b1b1b] uppercase">Instructor Audit Notes *</label>
              <textarea
                v-model="instructorNotes"
                @input="noteError = false"
                class="w-full min-h-[90px] resize-none border rounded-[6px] p-3 text-sm focus:ring-0 placeholder-[#7e7576]/40"
                :class="noteError ? 'border-red-600 bg-red-50/50' : 'border-[#C9BDB8] focus:border-[#940002]'"
                placeholder="Provide feedback explaining the score deviation audit details..."
              ></textarea>
              <p v-if="noteError" class="text-[10px] text-red-600 font-bold mt-1 uppercase">
                ⚠️ Note field blocks save if empty. Internal audit track required.
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6 border-t border-[#C9BDB8]/30 pt-4">
            <button type="button" class="px-4 py-2 border border-[#C9BDB8] text-xs font-bold rounded-[6px]" @click="isModalOpen = false">CANCEL</button>
            <button type="button" class="px-5 py-2 bg-[#940002] text-white text-xs font-bold rounded-[6px]" @click="confirmOverride">CONFIRM OVERRIDE</button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: all 250ms ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; transform: scale(0.96); }
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
