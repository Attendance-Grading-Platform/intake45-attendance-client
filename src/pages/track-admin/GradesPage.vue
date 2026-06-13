<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGradeStore } from '@/stores/grade.store'
import GradeOverridePanel from '@/components/track-admin/GradeOverridePanel.vue'
import axios from 'axios'

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
}

// ── Store & state ──────────────────────────────────────────
const gradeStore = useGradeStore()

const cohorts         = ref<CohortOption[]>([])
const selectedCohort  = ref<number | null>(null)
const searchQuery     = ref('')
const isPanelOpen     = ref(false)
const selectedGrade   = ref<GradeRecord | null>(null)
const grades          = ref<GradeRecord[]>([])

const filteredGrades = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return grades.value
  return grades.value.filter(g => g.student_name.toLowerCase().includes(q))
})

// ── Mount ─────────────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/cohorts').catch(() => ({ data: { data: [] } }))
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
  grades.value = result as GradeRecord[]
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
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-8 space-y-6 font-sans">
    <div class="flex items-center justify-between border-b border-neutral-200 pb-5">
      <div>
        <p class="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mb-1">Track Administration</p>
        <h1 class="font-serif text-3xl font-medium text-neutral-900">Grades Audit Trail</h1>
      </div>

      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search students..."
          class="h-10 w-64 rounded-lg border border-neutral-300 px-3 text-sm focus:border-neutral-950 outline-none transition-colors"
        />

        <select
          v-model="selectedCohort"
          class="h-10 rounded-lg border border-neutral-300 px-3 text-sm bg-neutral-0 focus:border-neutral-950 outline-none transition-colors"
          @change="handleRefresh"
        >
          <option v-for="c in cohorts" :key="c.id" :value="c.id">{{ c.name }}</option>
          <option v-if="cohorts.length === 0" :value="1">Dev Fallback Cohort</option>
        </select>
      </div>
    </div>

    <!-- Grades table -->
    <div class="rounded-xl border border-neutral-200 overflow-hidden">
      <div v-if="gradeStore.isLoading" class="py-12 text-center text-sm text-neutral-400 animate-pulse">
        Loading grades…
      </div>

      <div v-else-if="filteredGrades.length === 0" class="py-12 text-center text-sm text-neutral-400">
        No grade records found.
      </div>

      <table v-else class="w-full text-sm text-left border-collapse">
        <thead>
          <tr class="bg-neutral-50 border-b border-neutral-200">
            <th class="py-3 px-5 text-[11px] text-neutral-500 uppercase tracking-[0.12em] font-normal">Student</th>
            <th class="py-3 px-5 text-[11px] text-neutral-500 uppercase tracking-[0.12em] font-normal">Component</th>
            <th class="py-3 px-5 text-[11px] text-neutral-500 uppercase tracking-[0.12em] font-normal text-right">Score</th>
            <th class="py-3 px-5 text-[11px] text-neutral-500 uppercase tracking-[0.12em] font-normal">Graded By</th>
            <th class="py-3 px-5 text-[11px] text-neutral-500 uppercase tracking-[0.12em] font-normal text-center">Override</th>
            <th class="py-3 px-5 text-[11px] text-neutral-500 uppercase tracking-[0.12em] font-normal text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-100">
          <tr
            v-for="grade in filteredGrades"
            :key="grade.id"
            class="hover:bg-neutral-50 transition-colors"
          >
            <td class="py-3.5 px-5 font-medium text-neutral-900">{{ grade.student_name }}</td>
            <td class="py-3.5 px-5 text-neutral-600">{{ grade.component_name }}</td>
            <td class="py-3.5 px-5 text-right font-mono text-neutral-700 tabular-nums">
              {{ grade.raw_score }} / {{ grade.raw_max }}
            </td>
            <td class="py-3.5 px-5 text-neutral-500 text-xs">{{ grade.graded_by_name ?? '—' }}</td>
            <td class="py-3.5 px-5 text-center">
              <span
                v-if="grade.original_value !== null && grade.original_value !== undefined"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700"
              >
                Overridden
              </span>
              <span v-else class="text-neutral-300 text-xs">—</span>
            </td>
            <td class="py-3.5 px-5 text-right">
              <button
                class="h-7 px-3 rounded-md border border-neutral-300 text-xs text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                @click="openOverride(grade)"
              >
                Override
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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
