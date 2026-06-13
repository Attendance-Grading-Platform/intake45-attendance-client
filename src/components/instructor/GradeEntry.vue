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
const scores     = ref<Record<string, number | null>>({})
const isSaving   = ref(false)
const saveMsg    = ref<string | null>(null)

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

onMounted(load)
</script>

<template>
  <div class="min-h-screen bg-brand-surface p-6">

    <div class="mb-6">
      <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-1">Instructor</p>
      <h1 class="font-serif text-[36px] text-neutral-800 leading-tight">Grade Entry</h1>
      <hr class="mt-3 border-t border-neutral-300" />
    </div>

    <div v-if="isLoading" class="bg-white rounded-card border border-neutral-300 p-10 flex items-center justify-center gap-3">
      <div class="w-5 h-5 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      <span class="font-sans text-sm text-neutral-500">Loading grades…</span>
    </div>

    <template v-else>
      <GradeEntryTable
        :students="students"
        :components="components"
        v-model="scores"
      />

      <div class="mt-4 flex items-center justify-between">
        <Transition name="fade">
          <p
            v-if="saveMsg"
            class="font-sans text-sm"
            :class="saveMsg.includes('failed') ? 'text-danger' : 'text-success'"
          >
            {{ saveMsg }}
          </p>
          <span v-else />
        </Transition>

        <button
          :disabled="!hasChanges || isSaving"
          class="h-btn px-6 rounded-btn font-sans text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="hasChanges && !isSaving
            ? 'bg-brand-red text-white hover:bg-brand-redHover'
            : 'bg-neutral-200 text-neutral-500'"
          @click="save"
        >
          {{ isSaving ? 'Saving…' : 'Save Scores' }}
        </button>
      </div>
    </template>

  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>
