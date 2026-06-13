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
  <div class="bg-white rounded-card border border-neutral-300 overflow-hidden">

    <div class="px-6 py-4 border-b border-neutral-300 bg-neutral-50 flex items-center justify-between">
      <div>
        <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-0.5">Grade Entry</p>
        <h3 class="font-sans text-h3 font-medium text-neutral-800">Lab Group Scores</h3>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="h-1.5 w-24 rounded-full bg-neutral-200 overflow-hidden">
            <div
              class="h-full rounded-full bg-brand-red transition-all duration-slow"
              :style="{ width: completionPercent + '%' }"
            />
          </div>
          <span class="font-sans text-[11px] text-neutral-500 tabular-nums">
            {{ filledCount }} / {{ totalCells }}
          </span>
        </div>
        <span class="font-sans text-[11px] text-neutral-400">{{ completionPercent }}% complete</span>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse font-sans text-sm">
        <thead>
          <tr class="bg-neutral-50">
            <th
              class="sticky left-0 z-10 bg-neutral-50 py-3 px-5 text-left text-[11px] text-neutral-500 uppercase tracking-[1.5px] font-normal border-b border-r border-neutral-300 min-w-50 whitespace-nowrap"
            >
              Student
            </th>
            <th
              v-for="comp in components"
              :key="comp.id"
              class="py-3 px-4 text-center text-[11px] text-neutral-500 uppercase tracking-[1.5px] font-normal border-b border-r border-neutral-300 min-w-32.5 last:border-r-0"
            >
              <div class="capitalize">{{ labelFor(comp) }}</div>
              <div class="text-[10px] text-neutral-400 normal-case tracking-normal font-sans mt-0.5">
                max {{ comp.raw_max }}
              </div>
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-neutral-300">
          <tr
            v-for="student in students"
            :key="student.id"
            class="group hover:bg-neutral-50 transition-colors"
          >
            <td
              class="sticky left-0 z-10 bg-white group-hover:bg-neutral-50 py-2.5 px-5 font-sans text-sm font-medium text-neutral-800 border-r border-neutral-300 whitespace-nowrap transition-colors"
            >
              {{ student.name }}
            </td>
            <td
              v-for="comp in components"
              :key="comp.id"
              class="py-2 px-3 border-r border-neutral-300 last:border-r-0"
            >
              <input
                :value="getScore(student.id, comp.id) ?? ''"
                :disabled="readonly"
                type="number"
                min="0"
                :max="comp.raw_max"
                step="0.5"
                class="w-full h-9 rounded-input border bg-neutral-50 text-center font-mono text-sm text-neutral-800 focus:bg-white focus:outline-none transition-colors placeholder:text-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed"
                :class="
                  getScore(student.id, comp.id) !== null && getScore(student.id, comp.id)! > comp.raw_max
                    ? 'border-danger bg-danger-light focus:border-danger'
                    : 'border-neutral-300 focus:border-neutral-800'
                "
                placeholder="—"
                @input="setScore(student.id, comp.id, ($event.target as HTMLInputElement).value)"
              />
            </td>
          </tr>

          <tr v-if="students.length === 0">
            <td
              :colspan="components.length + 1"
              class="py-14 text-center font-sans text-sm text-neutral-500"
            >
              No students assigned to this lab group.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="px-6 py-3 bg-neutral-50 border-t border-neutral-300 flex items-center justify-between">
      <span class="font-sans text-[11px] text-neutral-400">
        {{ students.length }} students · {{ components.length }} components
      </span>
      <span
        v-if="completionPercent === 100"
        class="inline-flex items-center gap-1.5 font-sans text-[11px] text-success font-medium"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        All scores entered
      </span>
    </div>
  </div>
</template>
