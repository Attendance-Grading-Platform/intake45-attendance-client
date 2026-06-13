<script setup lang="ts">
import { ref} from 'vue'

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

// 1. Mock Data: Grading Components (Header)
const components = ref<GradeComponent[]>([
  { id: 101, name: 'Lab Deliverable 1', max: 50, weight: 20 },
  { id: 102, name: 'Midterm Project', max: 100, weight: 30 },
  { id: 103, name: 'Final Assessment', max: 100, weight: 50 }
])

// 2. Mock Data: Students List
const students = ref<StudentGradeRow[]>([
  { id: 1, name: 'Ahmed Hassan Essam', scores: { 101: 45, 102: 88, 103: null } },
  { id: 2, name: 'Sara Mahmoud Khalil', scores: { 101: 48, 102: 92, 103: null } },
  { id: 3, name: 'Mahmoud Fathy', scores: { 101: 30, 102: 75, 103: null } },
  { id: 4, name: 'Malak Essam', scores: { 101: 42, 102: null, 103: null } },
  { id: 5, name: 'Hany Abdelrahman', scores: { 101: 38, 102: 80, 103: null } },
  { id: 6, name: 'Nour El-Din Hassan', scores: { 101: 50, 102: 95, 103: null } },
  { id: 7, name: 'Yasmin Ali', scores: { 101: 44, 102: 85, 103: null } },
  { id: 8, name: 'Ziad Mansour', scores: { 101: 25, 102: 60, 103: null } },
])

const isSaving = ref(false)
const saveSuccess = ref(false)

// Logic to check if a score exceeds the component maximum
function isInvalid(score: number | null, max: number): boolean {
  if (score === null) return false
  return score > max
}

function handleSave() {
  isSaving.value = true
  setTimeout(() => {
    isSaving.value = false
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  }, 1000)
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
            Grade Spreadsheet - Section B
          </h1>
          <p class="text-xs text-[#4c4546] mt-2 italic">Keyboard optimization: Use Tab to navigate between cells.</p>
        </div>

        <div class="flex gap-4 items-center">
          <Transition name="fade">
            <span v-if="saveSuccess" class="text-green-700 font-bold text-xs uppercase tracking-wider">
              ✓ Scores synchronized to Railway
            </span>
          </Transition>
          <button
            @click="handleSave"
            :disabled="isSaving"
            class="bg-[#940002] text-white px-8 py-3 rounded-md font-bold text-[11px] uppercase tracking-[1px] hover:opacity-90 transition-all disabled:opacity-50"
          >
            {{ isSaving ? 'Synchronizing...' : 'Save All Changes' }}
          </button>
        </div>
      </header>

      <div class="bg-white border border-[#C9BDB8] rounded-[10px] overflow-hidden shadow-sm">
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
                  <p class="text-[9px] text-[#4c4546] font-mono mt-1">MAX: {{ comp.max }} pts</p>
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
              @input="student.scores[comp.id] = ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value)"
              class="w-full h-10 text-center border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-[#940002] rounded-sm font-mono text-[14px] transition-all"
              :class="{ 'text-red-600 font-bold bg-red-50': isInvalid(student.scores[comp.id] as any, comp.max) }"
              placeholder="--"
            />
            <span
              v-if="isInvalid(student.scores[comp.id] as any, comp.max)"
              class="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full z-20 whitespace-nowrap"
            >
              Exceeds Max!
            </span>
                  </div>
                </td>

                <td class="py-3 px-6 text-center bg-[#f9f9f9] border-l border-[#C9BDB8]">
                  <span class="font-mono font-bold text-[14px] text-[#940002]">
                    {{
                      Math.round(
                        Object.values(student.scores).reduce((a, b) => (a || 0) + (b || 0), 0)! /
                        components.reduce((a, b) => a + b.max, 0) * 100
                      )
                    }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <footer class="mt-8 flex justify-between items-center opacity-60">
        <p class="text-[10px] font-bold text-[#4c4546] uppercase tracking-[1px]">Drafting Mode · Changes not yet synced</p>
        <p class="text-[10px] font-bold text-[#4c4546] uppercase tracking-[1px]">Cohort Data: Intake 45 · Section B</p>
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
