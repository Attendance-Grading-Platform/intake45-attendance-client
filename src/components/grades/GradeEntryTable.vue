<script setup lang="ts">
import { computed } from 'vue'

interface Student {
  id: number
  name: string
}

interface GradeComponent {
  id: number
  name?: string
  type: string
  raw_max: number
}

interface Props {
  students: Student[]
  components: GradeComponent[]
  modelValue: Record<string, number | null>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), { readonly: false })
const emit = defineEmits<{ 'update:modelValue': [value: Record<string, number | null>] }>()

function cellKey(studentId: number, componentId: number): string {
  return `${studentId}_${componentId}`
}

function getScore(studentId: number, componentId: number): number | null {
  return props.modelValue[cellKey(studentId, componentId)] ?? null
}

function setScore(studentId: number, componentId: number, raw: string): void {
  const parsed = raw === '' ? null : Number(raw)
  const key = cellKey(studentId, componentId)
  const max = props.components.find(c => c.id === componentId)?.raw_max ?? Infinity
  const clamped = parsed !== null ? Math.min(Math.max(0, parsed), max) : null
  emit('update:modelValue', { ...props.modelValue, [key]: clamped })
}

const filledCount = computed(() =>
  Object.values(props.modelValue).filter(v => v !== null).length
)

const totalCells = computed(() =>
  props.students.length * props.components.length
)

const completionPercent = computed(() =>
  totalCells.value === 0 ? 0 : Math.round((filledCount.value / totalCells.value) * 100)
)

function labelFor(comp: GradeComponent): string {
  return comp.name || comp.type.replace(/_/g, ' ')
}
</script>

<template>
  <div class="bg-white rounded-[10px] border border-[#C9BDB8] overflow-hidden shadow-sm">

    <div class="px-6 py-5 border-b border-[#C9BDB8]/60 bg-[#F5EDEA]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p class="font-sans text-[11px] text-[#4c4546] font-bold uppercase tracking-[1.5px] mb-1">Grade Entry</p>
        <h3 class="font-sans text-lg font-bold text-[#1b1b1b]">Lab Group Scores Spreadsheet</h3>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2.5">
          <div class="h-1.5 w-24 rounded-full bg-[#eeeeee] overflow-hidden">
            <div
              class="h-full rounded-full bg-[#940002] transition-all duration-500"
              :style="{ width: completionPercent + '%' }"
            />
          </div>
          <span class="font-mono text-[11px] text-[#4c4546] font-bold tabular-nums">
            {{ filledCount }} / {{ totalCells }}
          </span>
        </div>
        <span class="font-sans text-[11px] text-[#940002] font-bold uppercase tracking-[0.5px]">{{ completionPercent }}% complete</span>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse font-sans text-sm">
        <thead>
          <tr class="bg-[#F5EDEA]/30">
            <th
              class="sticky left-0 z-10 bg-[#F5EDEA]/40 py-4 px-6 text-left text-[11px] text-[#4c4546] uppercase tracking-[1.5px] font-bold border-b border-r border-[#C9BDB8] min-w-[240px] whitespace-nowrap"
            >
              Student Name
            </th>
            <th
              v-for="comp in components"
              :key="comp.id"
              class="py-4 px-4 text-center text-[11px] text-[#1b1b1b] uppercase tracking-[1px] font-bold border-b border-r border-[#C9BDB8]/40 min-w-[140px] last:border-r-0"
            >
              <div class="truncate max-w-[160px]">{{ labelFor(comp) }}</div>
              <div class="text-[10px] text-[#4c4546] font-mono font-normal tracking-normal normal-case mt-1">
                MAX {{ comp.raw_max }} pts
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-[#C9BDB8]/40">
          <tr
            v-for="student in students"
            :key="student.id"
            class="group hover:bg-[#F5EDEA]/20 transition-colors"
          >
            <td
              class="sticky left-0 z-10 bg-white group-hover:bg-[#F5EDEA]/20 py-3 px-6 font-sans text-sm font-bold text-[#1b1b1b] border-r border-[#C9BDB8] whitespace-nowrap transition-colors"
            >
              {{ student.name }}
            </td>
            <td
              v-for="comp in components"
              :key="comp.id"
              class="p-2 border-r border-[#C9BDB8]/30 last:border-r-0 relative group/cell"
            >
              <input
                :value="getScore(student.id, comp.id) ?? ''"
                :disabled="readonly"
                type="number"
                min="0"
                :max="comp.raw_max"
                step="0.5"
                class="w-full h-10 rounded-sm border-0 bg-transparent text-center font-mono text-[14px] text-[#1b1b1b] focus:bg-white focus:ring-1 focus:ring-[#940002] transition-colors placeholder:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                placeholder="—"
                @input="setScore(student.id, comp.id, ($event.target as HTMLInputElement).value)"
              />
            </td>
          </tr>

          <tr v-if="students.length === 0">
            <td
              :colspan="components.length + 1"
              class="py-16 text-center font-sans text-sm text-[#4c4546] bg-gray-50/50 italic"
            >
              No students assigned to this lab group.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="px-6 py-4 bg-[#f3f3f3] border-t border-[#C9BDB8]/60 flex items-center justify-between">
      <span class="font-sans text-[11px] font-bold text-[#4c4546] uppercase tracking-[0.5px]">
        {{ students.length }} students · {{ components.length }} components
      </span>
      <span
        v-if="completionPercent === 100"
        class="inline-flex items-center gap-1.5 font-sans text-[11px] text-green-700 font-bold uppercase tracking-[0.5px]"
      >
        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        All grades synchronized
      </span>
    </div>
  </div>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
