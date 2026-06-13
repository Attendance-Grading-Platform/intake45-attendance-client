<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as gradeApi from '@/api/modules/grade.api'
import type { BatchGradeItem } from '@/api/modules/grade.api'
import { useGradeStore } from '@/stores/grade.store'

const gradeStore = useGradeStore()

interface GradeComponent {
  id: number
  name: string
  max: number
  weight: number
}

interface StudentGradeRow {
  id: number
  name: string
  scores: Record<number, number | null>
}

const components = ref<GradeComponent[]>([])
const students = ref<StudentGradeRow[]>([])
const courseName = ref('')
const isLoading = ref(false)
const loadError = ref(false)
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref(false)

function isInvalid(score: number | null, max: number): boolean {
  if (score === null) return false
  return score < 0 || score > max
}

function parseScore(raw: string): number | null {
  if (raw === '') return null
  const n = Number(raw)
  return isNaN(n) ? null : n
}

function computeWeightedTotal(student: StudentGradeRow): number {
  let total = 0
  for (const comp of components.value) {
    const score = student.scores[comp.id] ?? null
    if (score === null || comp.max === 0) continue
    total += (score / comp.max) * comp.weight
  }
  return Math.round(total)
}

onMounted(async () => {
  isLoading.value = true
  loadError.value = false
  try {
    const res = await gradeApi.getGrades()
    const records = res.data.data ?? []

    if (records[0]?.course?.name) {
      courseName.value = records[0].course.name
    }

    // Derive unique components from API records
    const compMap = new Map<number, GradeComponent>()
    for (const g of records) {
      const cid = g.course_component?.id
      if (cid !== undefined && !compMap.has(cid)) {
        compMap.set(cid, {
          id: cid,
          name: g.course_component.type ?? `Component ${cid}`,
          max: g.raw_max,
          weight: g.course_component.weight ?? 0,
        })
      }
    }
    components.value = Array.from(compMap.values())

    // Derive student rows with scores keyed by component id
    const studentMap = new Map<number, StudentGradeRow>()
    for (const g of records) {
      const sid = g.student_id
      const cid = g.course_component?.id
      if (cid === undefined) continue
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          id: sid,
          name: g.student_name ?? `Student #${sid}`,
          scores: {},
        })
      }
      studentMap.get(sid)!.scores[cid] = g.raw_score
    }
    students.value = Array.from(studentMap.values())
  } catch (err) {
    console.error('Failed to load grades:', err)
    loadError.value = true
  } finally {
    isLoading.value = false
  }
})

async function handleSave() {
  isSaving.value = true
  saveSuccess.value = false
  saveError.value = false
  try {
    const payload: BatchGradeItem[] = []
    for (const student of students.value) {
      for (const comp of components.value) {
        const score = student.scores[comp.id]
        if (score !== null && score !== undefined && !isNaN(score)) {
          payload.push({ student_id: student.id, course_component_id: comp.id, raw_score: score, raw_max: comp.max })
        }
      }
    }
    const { failed } = await gradeStore.batchSaveGrades(payload)
    if (failed === 0) {
      saveSuccess.value = true
      setTimeout(() => { saveSuccess.value = false }, 3000)
    } else {
      saveError.value = true
      setTimeout(() => { saveError.value = false }, 4000)
    }
  } catch (err) {
    console.error('Grade save failed:', err)
    saveError.value = true
    setTimeout(() => { saveError.value = false }, 4000)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#E6DDD4] text-[#1b1b1b] font-sans pb-20">
    <div class="max-w-7xl mx-auto px-6 py-10">

      <header class="mb-10 flex justify-between items-end">
        <div>
          <span class="font-sans text-[11px] font-bold text-[#4c4546] uppercase tracking-[1.5px] opacity-70">
            Bulk Grade Entry
          </span>
          <h1 class="font-serif text-[36px] text-[#1b1b1b] mt-1 font-medium">
            Grade Spreadsheet{{ courseName ? ` — ${courseName}` : '' }}
          </h1>
          <p class="text-xs text-[#4c4546] mt-2 italic">Keyboard optimization: Use Tab to navigate between cells.</p>
        </div>

        <div class="flex gap-4 items-center">
          <Transition name="fade">
            <span v-if="saveSuccess" class="text-green-700 font-bold text-xs uppercase tracking-wider">
              ✓ Scores synchronized
            </span>
            <span v-else-if="saveError" class="text-red-700 font-bold text-xs uppercase tracking-wider">
              ✗ Save failed — check connection
            </span>
          </Transition>
          <button
            @click="handleSave"
            :disabled="isSaving || isLoading || students.length === 0"
            class="bg-[#940002] text-white px-8 py-3 rounded-md font-bold text-[11px] uppercase tracking-[1px] hover:opacity-90 transition-all disabled:opacity-50"
          >
            {{ isSaving ? 'Synchronizing...' : 'Save All Changes' }}
          </button>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="isLoading" class="bg-white border border-[#C9BDB8] rounded-[10px] py-20 text-center">
        <div class="w-6 h-6 border-2 border-[#C9BDB8] border-t-[#940002] rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm text-[#4c4546]">Loading grade data…</p>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="bg-white border border-[#C9BDB8] rounded-[10px] py-20 text-center">
        <p class="text-sm text-[#ba1a1a] font-medium">Failed to load grades. Please refresh the page.</p>
      </div>

      <!-- Empty -->
      <div v-else-if="students.length === 0" class="bg-white border border-[#C9BDB8] rounded-[10px] py-20 text-center">
        <p class="text-sm text-[#4c4546] italic">No grade records found for your assigned lab group.</p>
      </div>

      <!-- Grade table -->
      <div v-else class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-[#F5EDEA] border-b border-[#C9BDB8]">
                <th class="py-4 px-6 text-left font-bold text-[11px] text-[#4c4546] uppercase tracking-[1px] w-70 sticky left-0 bg-[#F5EDEA] z-10">
                  Student Name
                </th>
                <th
                  v-for="comp in components"
                  :key="comp.id"
                  class="py-4 px-6 text-center border-l border-[#C9BDB8]/40"
                >
                  <p class="font-bold text-[11px] text-[#1b1b1b] uppercase tracking-[0.5px] truncate max-w-37.5">
                    {{ comp.name }}
                  </p>
                  <p class="text-[9px] text-[#4c4546] font-mono mt-1">MAX: {{ comp.max }} pts · {{ comp.weight }}%</p>
                </th>
                <th class="py-4 px-6 text-center font-bold text-[11px] text-[#4c4546] uppercase tracking-[1px] bg-[#f9f9f9] border-l border-[#C9BDB8]">
                  Total (%)
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#C9BDB8]/40">
              <tr v-for="student in students" :key="student.id" class="hover:bg-[#F5EDEA]/30 transition-colors group">
                <td class="py-3 px-6 font-medium text-[14px] text-[#1b1b1b] sticky left-0 bg-white group-hover:bg-[#F5EDEA]/30 z-10">
                  {{ student.name }}
                </td>

                <td
                  v-for="comp in components"
                  :key="comp.id"
                  class="p-2 border-l border-[#C9BDB8]/20"
                >
                  <div class="relative group/input">
                    <input
                      type="number"
                      :value="student.scores[comp.id] ?? ''"
                      @input="student.scores[comp.id] = parseScore(($event.target as HTMLInputElement).value)"
                      class="w-full h-10 text-center border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-[#940002] rounded-sm font-mono text-[14px] transition-all"
                      :class="{ 'text-red-600 font-bold bg-red-50': isInvalid(student.scores[comp.id] ?? null, comp.max) }"
                      placeholder="--"
                    />
                    <span
                      v-if="isInvalid(student.scores[comp.id] ?? null, comp.max)"
                      class="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full z-20 whitespace-nowrap"
                    >
                      Exceeds Max!
                    </span>
                  </div>
                </td>

                <td class="py-3 px-6 text-center bg-[#f9f9f9] border-l border-[#C9BDB8]">
                  <span class="font-mono font-bold text-[14px] text-[#940002]">
                    {{ computeWeightedTotal(student) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <footer class="mt-8 flex justify-between items-center opacity-60">
        <p class="text-[10px] font-bold text-[#4c4546] uppercase tracking-[1px]">Drafting Mode · Changes not yet synced</p>
        <p class="text-[10px] font-bold text-[#4c4546] uppercase tracking-[1px]">Grading your assigned lab group only</p>
      </footer>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

table { border-spacing: 0; }
th, td { white-space: nowrap; }
</style>
