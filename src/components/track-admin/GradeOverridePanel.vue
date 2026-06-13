<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGradeStore } from '@/stores/grade.store'

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

const props = defineProps<{
  modelValue: boolean
  grade: GradeRecord
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'overridden': []
}>()

const gradeStore = useGradeStore()

const newScore = ref<number | null>(null)
const note     = ref('')
const isSaving = ref(false)
const errorMsg = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    newScore.value = props.grade.raw_score
    note.value     = props.grade.override_note ?? ''
    errorMsg.value = ''
  }
})

function close() {
  emit('update:modelValue', false)
}

async function submit() {
  if (newScore.value === null) return
  if (note.value.trim().length < 5) {
    errorMsg.value = 'Override reason must be at least 5 characters.'
    return
  }
  isSaving.value = true
  errorMsg.value = ''
  const ok = await gradeStore.overrideGrade(props.grade.id, {
    new_score: newScore.value,
    note: note.value.trim(),
  })
  isSaving.value = false
  if (ok) {
    emit('overridden')
    close()
  } else {
    errorMsg.value = gradeStore.overrideError ?? 'Override failed. Please try again.'
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-80 bg-black/30"
        @click.self="close"
      />
    </Transition>

    <Transition name="slide">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 z-90 w-full max-w-105 bg-white shadow-xl flex flex-col"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-neutral-200 flex items-center justify-between">
          <h2 class="font-serif text-xl text-neutral-900">Override Grade</h2>
          <button
            class="text-neutral-400 hover:text-neutral-700 text-2xl leading-none"
            @click="close"
          >
            &times;
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 flex-1 overflow-y-auto space-y-5">
          <!-- Current grade summary -->
          <div class="bg-neutral-50 rounded-lg border border-neutral-200 p-4 space-y-1 text-sm">
            <p class="font-medium text-neutral-800">{{ grade.student_name }}</p>
            <p class="text-neutral-500">{{ grade.component_name }}</p>
            <p class="text-neutral-600">
              Current score:
              <span class="font-mono font-semibold">{{ grade.raw_score }}</span>
              / {{ grade.raw_max }}
            </p>
            <div v-if="grade.original_value !== null && grade.original_value !== undefined" class="mt-2 pt-2 border-t border-neutral-200 space-y-0.5">
              <p class="text-xs text-neutral-500 font-medium">Override History</p>
              <p class="text-xs text-neutral-400">
                Original: <span class="font-mono">{{ grade.original_value }}</span>
                · By {{ grade.overridden_by_name ?? '—' }}
              </p>
              <p v-if="grade.override_note" class="text-xs text-neutral-400 italic">
                "{{ grade.override_note }}"
              </p>
            </div>
          </div>

          <!-- New score input -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1.5">New Score</label>
            <input
              v-model.number="newScore"
              type="number"
              :min="0"
              :max="grade.raw_max"
              class="w-full h-10 rounded-lg border border-neutral-300 px-3 text-sm focus:border-neutral-800 outline-none transition-colors"
            />
            <div class="mt-1 flex items-center justify-between">
              <p class="text-xs text-neutral-400">Max: {{ grade.raw_max }}</p>
              <p class="text-xs text-neutral-500 tabular-nums">
                Normalized:
                <span class="font-mono font-medium text-neutral-700">
                  {{ newScore !== null && grade.raw_max > 0
                    ? ((newScore / grade.raw_max) * 100).toFixed(1) + '%'
                    : '—' }}
                </span>
              </p>
            </div>
          </div>

          <!-- Reason / note -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-1.5">
              Override Reason
              <span class="font-normal text-neutral-400">(min 5 characters)</span>
            </label>
            <textarea
              v-model="note"
              rows="4"
              placeholder="Explain why this grade is being overridden…"
              class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-800 outline-none resize-none transition-colors"
            />
          </div>

          <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            class="h-9 px-4 rounded-lg border border-neutral-300 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            @click="close"
          >
            Cancel
          </button>
          <button
            :disabled="isSaving || newScore === null || note.trim().length < 5"
            class="h-9 px-5 rounded-lg bg-neutral-900 text-white text-sm disabled:opacity-40 transition-opacity"
            @click="submit"
          >
            {{ isSaving ? 'Saving…' : 'Apply Override' }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
