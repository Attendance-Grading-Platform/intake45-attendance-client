<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface OverrideGrade {
  id: number
  student_id: number
  raw_score: number
  raw_max: number
  final_score: number
  override_note: string | null
  course_component?: {
    type?: string
    weight?: number
    course?: { name?: string }
  }
}

const props = defineProps<{
  isOpen: boolean
  grade: OverrideGrade | null
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: { gradeId: number; newScore: number; note: string }]
}>()

const newScore = ref<number | null>(null)
const overrideNote = ref('')
const attempted = ref(false)
const isSubmitting = ref(false)

watch(
  () => props.grade,
  (g) => {
    if (g) {
      newScore.value = g.raw_score
      overrideNote.value = g.override_note ?? ''
      attempted.value = false
      isSubmitting.value = false
    }
  }
)

const noteLength = computed(() => overrideNote.value.trim().length)
const noteIsEmpty = computed(() => noteLength.value === 0)
const noteIsTooShort = computed(() => noteLength.value > 0 && noteLength.value < 5)
const noteInvalid = computed(() => attempted.value && (noteIsEmpty.value || noteIsTooShort.value))

const scorePercent = computed(() => {
  if (!props.grade) return 0
  return Math.min(Math.round((props.grade.raw_score / props.grade.raw_max) * 100), 100)
})

function handleSubmit() {
  attempted.value = true
  if (!props.grade || newScore.value === null) return
  if (noteIsEmpty.value || noteIsTooShort.value) return
  isSubmitting.value = true
  emit('submit', {
    gradeId: props.grade.id,
    newScore: newScore.value,
    note: overrideNote.value.trim(),
  })
}

function handleClose() {
  if (isSubmitting.value) return
  attempted.value = false
  emit('close')
}

function courseLabel(grade: OverrideGrade): string {
  const parts: string[] = []
  if (grade.course_component?.course?.name) parts.push(grade.course_component.course.name)
  if (grade.course_component?.type) parts.push(grade.course_component.type.replace(/_/g, ' '))
  return parts.join(' — ') || 'Unknown Component'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="isOpen && grade" class="fixed inset-0 z-modal flex items-stretch justify-end">

        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-sm"
          @click="handleClose"
        />

        <div class="relative bg-white border-l border-neutral-300 w-drawer max-w-full shadow-drawer flex flex-col">

          <div class="px-8 py-6 border-b border-neutral-300">
            <p class="font-sans text-[11px] text-brand-red uppercase tracking-[1.5px] mb-1">
              Administrative Action
            </p>
            <div class="flex items-start justify-between gap-4">
              <h2 class="font-serif text-[26px] text-neutral-800 leading-tight">Override Grade</h2>
              <button
                class="mt-1 h-btn-xs w-7.5 rounded-btn border border-neutral-300 flex items-center justify-center text-neutral-500 hover:text-neutral-800 hover:border-neutral-800 transition-colors shrink-0"
                @click="handleClose"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto px-8 py-6 space-y-6">

            <div class="bg-neutral-50 border border-neutral-300 rounded-card p-5">
              <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-4">
                Original Instructor Score
              </p>
              <div class="flex items-end gap-3 mb-3">
                <span class="font-serif text-[52px] leading-none text-neutral-800 tabular-nums">
                  {{ grade.raw_score }}
                </span>
                <span class="font-sans text-sm text-neutral-500 mb-2">/ {{ grade.raw_max }}</span>
                <span class="mb-2 ml-auto font-sans text-sm text-neutral-500 tabular-nums">
                  {{ scorePercent }}%
                </span>
              </div>
              <div class="h-1.5 rounded-full bg-neutral-200 overflow-hidden mb-3">
                <div
                  class="h-full rounded-full bg-neutral-800 transition-all"
                  :style="{ width: scorePercent + '%' }"
                />
              </div>
              <p class="font-sans text-[12px] text-neutral-500 capitalize">{{ courseLabel(grade) }}</p>
            </div>

            <div>
              <label class="block font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-2">
                New Raw Score
              </label>
              <input
                v-model.number="newScore"
                type="number"
                min="0"
                :max="grade.raw_max"
                step="0.5"
                class="h-input w-full rounded-input border border-neutral-300 bg-neutral-50 px-4 font-mono text-sm text-neutral-800 focus:border-neutral-800 focus:bg-white focus:outline-none transition-colors"
              />
              <p class="mt-1 font-sans text-[11px] text-neutral-400">Max allowed: {{ grade.raw_max }}</p>
            </div>

            <div>
              <div class="flex items-baseline justify-between mb-2">
                <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px]">
                  Reason for Override
                  <span class="text-danger font-bold ml-0.5">*</span>
                </label>
                <span
                  class="font-sans text-[11px] tabular-nums transition-colors"
                  :class="noteInvalid ? 'text-danger' : 'text-neutral-400'"
                >
                  {{ noteLength }} char{{ noteLength !== 1 ? 's' : '' }}
                </span>
              </div>

              <textarea
                v-model="overrideNote"
                rows="5"
                placeholder="Provide a clear justification for this score override..."
                class="w-full rounded-input border px-4 py-3 font-sans text-sm text-neutral-800 bg-neutral-50 focus:bg-white focus:outline-none transition-colors resize-none"
                :class="
                  noteInvalid
                    ? 'border-danger bg-danger-light focus:border-danger'
                    : 'border-neutral-300 focus:border-neutral-800'
                "
              />

              <Transition name="fade">
                <div
                  v-if="noteInvalid"
                  class="mt-2 flex items-center gap-2 rounded-badge border border-danger/30 bg-danger-light px-3 py-2"
                >
                  <svg width="14" height="14" class="text-danger shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v4m0 4h.01"/>
                  </svg>
                  <p class="font-sans text-xs text-danger">
                    {{ noteIsEmpty
                      ? 'A reason is required. The save action is blocked until this field is filled.'
                      : 'Reason must be at least 5 characters long.'
                    }}
                  </p>
                </div>
              </Transition>
            </div>

          </div>

          <div class="px-8 py-5 border-t border-neutral-300 flex gap-3">
            <button
              :disabled="isSubmitting"
              class="h-btn flex-1 rounded-btn border border-neutral-300 font-sans text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              :disabled="isSubmitting"
              class="h-btn flex-2 rounded-btn font-sans text-sm text-white transition-colors"
              :class="
                attempted && (noteIsEmpty || noteIsTooShort)
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-800 hover:bg-neutral-900 disabled:opacity-50'
              "
              @click="handleSubmit"
            >
              {{ isSubmitting ? 'Saving…' : 'Confirm Override' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
