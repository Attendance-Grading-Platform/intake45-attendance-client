<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGradeStore } from '@/stores/grade.store'
import GradeOverridePanel from '@/components/track-admin/GradeOverridePanel.vue'
import api from '@/api/axios'

// ── Types ──────────────────────────────────────────────────
interface CohortOption {
  id: number
  name: string
  status?: string
}

interface GradeRecord {
  id: number
  student_id: number
  student_name: string
  course_component_id: number
  component_name: string
  raw_score: number
  raw_max: number
  graded_by_name?: string
  original_value?: number | null
  override_note?: string | null
  overridden_by_name?: string | null
  // Added fields for GRD-5 final grading capability
  final_exam_grade?: number | null
  project_grade?: number | null
}

// ── Store & state ──────────────────────────────────────────
const gradeStore = useGradeStore()

const cohorts         = ref<CohortOption[]>([])
const selectedCohort  = ref<number | null>(null)
const searchQuery     = ref('')
const isPanelOpen     = ref(false)
const selectedGrade   = ref<GradeRecord | null>(null)
const grades          = ref<GradeRecord[]>([])
const isSavingFinal   = ref(false)
const saveSuccess     = ref(false)
const saveFinalError  = ref(false)

const filteredGrades = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return grades.value
  return grades.value.filter(g => g.student_name.toLowerCase().includes(q))
})

// ── Mount ─────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await api.get('/v1/cohorts').catch(() => ({ data: { data: [] } }))
    cohorts.value = (res.data.data ?? []) as CohortOption[]

    const active = cohorts.value.find((c) => c.status === 'active')
    const firstId = cohorts.value[0]?.id ?? null
    if (active) {
      selectedCohort.value = active.id
    } else if (firstId !== null) {
      selectedCohort.value = firstId
    } else if (import.meta.env.DEV) {
      selectedCohort.value = 1
    }

    if (selectedCohort.value) {
      await loadGrades(selectedCohort.value)
    }
  } catch {
    if (import.meta.env.DEV) {
      selectedCohort.value = 1
      await loadGrades(1)
    }
  }
})

// ── Actions ───────────────────────────────────────────────
async function loadGrades(cohortId: number) {
  const result = await gradeStore.fetchCohortGrades(cohortId)
  // Ensure fields are initialized if not present from backend
  grades.value = (result as GradeRecord[]).map(g => ({
    ...g,
    final_exam_grade: g.final_exam_grade ?? null,
    project_grade: g.project_grade ?? null
  }))
}

function openOverride(gradeRecord: GradeRecord) {
  selectedGrade.value = gradeRecord
  isPanelOpen.value   = true
}

async function handleRefresh() {
  if (selectedCohort.value) {
    await loadGrades(selectedCohort.value)
  }
}

function handlePanelUpdate(val: boolean) {
  isPanelOpen.value = val
}

// Added backend submission function for final admin records
async function saveFinalGrades() {
  if (!selectedCohort.value) return
  isSavingFinal.value = true
  saveSuccess.value  = false
  saveFinalError.value = false
  try {
    const payload = grades.value.map(g => ({
      student_id: g.student_id,
      course_component_id: g.course_component_id,
      final_exam_grade: g.final_exam_grade,
      project_grade: g.project_grade
    }))
    await api.post('/v1/admin/final-grades/batch', {
      cohort_id: selectedCohort.value,
      grades: payload
    })
    saveSuccess.value = true
  } catch {
    saveFinalError.value = true
  } finally {
    isSavingFinal.value = false
    setTimeout(() => { saveSuccess.value = false; saveFinalError.value = false }, 4000)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#E6DDD4] text-[#1b1b1b] font-sans pb-16 p-6">

    <div class="mb-10 flex items-center justify-between">
      <div>
        <span class="font-sans text-[11px] font-bold text-[#4c4546] uppercase tracking-[1.5px] mb-1 block">Track Administration</span>
        <h1 class="font-serif text-[36px] text-[#1b1b1b] leading-tight font-medium">Grades Audit & Final Entry</h1>
        <div class="h-px bg-[#C9BDB8] w-full mt-4"></div>
      </div>

      <div class="flex items-center gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search student records..."
          class="h-11 w-64 bg-white border border-[#C9BDB8] rounded-md px-4 text-sm focus:border-[#940002] focus:ring-0 outline-none transition-colors placeholder-[#7e7576]/50"
        />

        <select
          v-model="selectedCohort"
          class="h-11 bg-white border border-[#C9BDB8] rounded-md px-4 text-sm focus:border-[#940002] focus:ring-0 outline-none transition-colors"
          @change="handleRefresh"
        >
          <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ c.name }}</option>
          <option v-if="cohorts.length === 0" :value="1">Dev Fallback Cohort</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-[#C9BDB8] overflow-hidden shadow-sm">
      <div v-if="gradeStore.isLoading" class="py-16 text-center text-sm text-[#4c4546] flex items-center justify-center gap-3">
        <div class="w-5 h-5 border-2 border-[#C9BDB8] border-t-[#940002] rounded-full animate-spin"></div>
        <span>Synchronizing matrix logs…</span>
      </div>

      <div v-else-if="filteredGrades.length === 0" class="py-16 text-center text-sm text-[#4c4546] italic">
        No active grade parameters found for the selected track cohort.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left border-collapse tabular-nums">
          <thead>
            <tr class="bg-[#F5EDEA]/40 border-b border-[#C9BDB8]">
              <th class="py-4 px-6 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">Student</th>
              <th class="py-4 px-5 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">Component</th>
              <th class="py-4 px-5 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold text-right">Midterm/Lab Score</th>
              <th class="py-4 px-5 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold text-center">Final Exam (Max 100)</th>
              <th class="py-4 px-5 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold text-center">Project (Max 100)</th>
              <th class="py-4 px-5 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold">Graded By</th>
              <th class="py-4 px-5 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold text-center">Audit Track</th>
              <th class="py-4 px-6 text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#C9BDB8]/30">
            <tr
              v-for="grade in filteredGrades"
              :key="grade.id"
              class="hover:bg-[#F5EDEA]/10 transition-colors"
            >
              <td class="py-4 px-6 font-bold text-[#1b1b1b]">{{ grade.student_name }}</td>
              <td class="py-4 px-5 text-gray-700 font-medium">{{ grade.component_name }}</td>
              <td class="py-4 px-5 text-right font-mono font-bold text-[#1b1b1b]">
                {{ grade.raw_score }} / {{ grade.raw_max }}
              </td>
              <td class="py-4 px-5 text-center">
                <input
                  type="number"
                  v-model.number="grade.final_exam_grade"
                  placeholder="—"
                  class="w-24 h-9 border border-[#C9BDB8] rounded-sm text-center focus:ring-0 focus:border-[#940002] font-mono text-xs bg-transparent"
                />
              </td>
              <td class="py-4 px-5 text-center">
                <input
                  type="number"
                  v-model.number="grade.project_grade"
                  placeholder="—"
                  class="w-24 h-9 border border-[#C9BDB8] rounded-sm text-center focus:ring-0 focus:border-[#940002] font-mono text-xs bg-transparent"
                />
              </td>
              <td class="py-4 px-5 text-[#4c4546] text-xs font-medium">{{ grade.graded_by_name ?? 'System Ledger' }}</td>
              <td class="py-4 px-5 text-center">
                <span
                  v-if="grade.original_value !== null && grade.original_value !== undefined"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-[0.5px]"
                >
                  Overridden
                </span>
                <span v-else class="text-neutral-300 text-xs">—</span>
              </td>
              <td class="py-4 px-6 text-right">
                <button
                  class="h-8 px-4 rounded-sm border border-[#940002] text-xs text-[#940002] font-sans font-bold uppercase tracking-[0.5px] hover:bg-[#940002]/5 transition-colors"
                  @click="openOverride(grade)"
                >
                  Override
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-6 flex items-center justify-between">
      <div>
        <Transition name="fade">
          <p v-if="saveSuccess" class="text-xs font-bold text-green-700 uppercase tracking-[0.5px]">
            ✓ Final records and terminal exams updated globally.
          </p>
          <p v-else-if="saveFinalError" class="text-xs font-bold text-[#ba1a1a] uppercase tracking-[0.5px]">
            Save failed — changes recorded locally only.
          </p>
        </Transition>
      </div>
      <button
        type="button"
        :disabled="isSavingFinal || filteredGrades.length === 0"
        @click="saveFinalGrades"
        class="h-12 px-10 rounded-md bg-[#940002] text-white text-[11px] font-bold uppercase tracking-[1.5px] shadow-sm hover:opacity-90 transition-all disabled:opacity-40"
      >
        {{ isSavingFinal ? 'Synchronizing…' : 'Save Final & Project Grades' }}
      </button>
    </div>

    <GradeOverridePanel
      v-if="selectedGrade"
      :model-value="isPanelOpen"
      :grade="selectedGrade"
      @update:model-value="handlePanelUpdate"
      @overridden="handleRefresh"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 250ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
