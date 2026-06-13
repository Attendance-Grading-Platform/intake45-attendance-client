<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ComponentFormState, CreateComponentPayload } from '@/types/course.types'
import ConfigureWeightsForm from '@/components/courses/ConfigureWeightsForm.vue'

// --- Props & Emits ---
const props = defineProps<{
    open: boolean
    saving: boolean
}>()

const emit = defineEmits<{
    close: []
    save: [name: string, components: CreateComponentPayload[]]
}>()

// --- State ---
const step = ref<1 | 2>(1)
const courseName = ref('')

const lab = ref<ComponentFormState>({ included: true, weight: 50, due_date: null })
const exam = ref<ComponentFormState>({ included: true, weight: 50, due_date: null })

const weightsFormRef = ref<InstanceType<typeof ConfigureWeightsForm> | null>(null)

// Get today's date in YYYY-MM-DD format to prevent past-date scheduling
const todayISO = new Date().toISOString().split('T')[0] || ''

// --- Computed Validations ---

// Step 1 Validation: Ensure course name has substance
const isNameValid = computed(() => courseName.value.trim().length >= 2)

/**
 * FIX 1: The NaN Bug (Strict Number Parsing)
 * Safely parses the inputs as floats to prevent string concatenation (e.g., "50" + "50" = "5050").
 */
const totalWeight = computed(() => {
    const labW = lab.value.included ? (parseFloat(String(lab.value.weight)) || 0) : 0
    const examW = exam.value.included ? (parseFloat(String(exam.value.weight)) || 0) : 0
    return labW + examW
})

/**
 * FIX 2 & 3: Chronological & Past Date Validations
 * Enforces business logic: Dates cannot be in the past, and Labs must precede Finals.
 */
const dateValidationErrors = computed(() => {
    const errors: string[] = []
    const labDate = lab.value.due_date
    const examDate = exam.value.due_date

    // Rule A: No scheduling in the past
    if (lab.value.included && labDate && labDate < todayISO) {
        errors.push('Dates cannot be scheduled in the past.')
    }
    if (exam.value.included && examDate && examDate < todayISO) {
        // Prevent duplicate error messages
        if (!errors.includes('Dates cannot be scheduled in the past.')) {
            errors.push('Dates cannot be scheduled in the past.')
        }
    }

    // Rule B: Lab deliverables must be due BEFORE the Final Exam
    if (lab.value.included && exam.value.included && labDate && examDate) {
        if (labDate > examDate) {
            errors.push('Lab deliverables must be due before the final exam.')
        }
    }

    return errors
})

// Step 2 Validation: Weights must sum to 100 AND dates must be logically valid
const canSave = computed(() => {
    return totalWeight.value === 100 && dateValidationErrors.value.length === 0
})

// --- Methods ---

function resetForm() {
    step.value = 1
    courseName.value = ''
    lab.value = { included: true, weight: 50, due_date: null }
    exam.value = { included: true, weight: 50, due_date: null }
}

function handleClose() {
    if (props.saving) return
    resetForm()
    emit('close')
}

function goToStep2() {
    if (!isNameValid.value) return
    step.value = 2
}

function goToStep1() {
    step.value = 1
}

/**
 * Constructs the final payload to send to Laravel.
 * Ensures weights are safely cast to Numbers before transmission.
 */
function buildComponents(): CreateComponentPayload[] {
    const components: CreateComponentPayload[] = []

    const parsedLabWeight = parseFloat(String(lab.value.weight)) || 0
    if (lab.value.included && parsedLabWeight > 0) {
        components.push({
            type: 'lab_deliverable',
            weight: parsedLabWeight,
            due_date: lab.value.due_date,
        })
    }

    const parsedExamWeight = parseFloat(String(exam.value.weight)) || 0
    if (exam.value.included && parsedExamWeight > 0) {
        components.push({
            type: 'final_exam',
            weight: parsedExamWeight,
            due_date: exam.value.due_date,
        })
    }

    return components
}

function handleSave() {
    if (!canSave.value || props.saving) return
    emit('save', courseName.value.trim(), buildComponents())
}

// Reset form automatically when modal closes from external triggers
watch(
    () => props.open,
    (isOpen) => {
        if (!isOpen) resetForm()
    }
)

defineExpose({ resetForm })
</script>

<template>
    <Teleport to="body">
        <Transition name="overlay">
            <div
                v-if="open"
                class="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
                @click.self="handleClose"
            >
                <div
                    class="w-full max-w-lg bg-white rounded-card border border-neutral-300 p-6 max-h-[90vh] overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="add-course-title"
                >
                    <template v-if="step === 1">
                        <h2 id="add-course-title" class="font-serif text-[22px] text-neutral-800 mb-1">
                            Add Course
                        </h2>
                        <p class="font-sans text-sm text-neutral-600 mb-6">
                            Enter a name for the new course
                        </p>

                        <div class="flex flex-col gap-1.5 mb-6">
                            <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px]">
                                Course Name <span class="text-danger">*</span>
                            </label>
                            <input
                                v-model="courseName"
                                type="text"
                                placeholder="e.g. Laravel, Vue.js, Database Design"
                                class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base focus:outline-none focus:border-brand-red transition-colors"
                                @keydown.enter.prevent="goToStep2"
                            />
                            <p class="font-sans text-xs text-neutral-500 text-right tabular-nums">
                                {{ courseName.length }} characters
                            </p>
                        </div>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                class="h-[38px] px-4 text-sm font-sans rounded-[6px] border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                                :disabled="saving"
                                @click="handleClose"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                class="h-[38px] px-4 text-sm font-sans rounded-[6px] bg-[#8B1A1A] text-white hover:bg-[#7a0002] transition-colors disabled:opacity-50"
                                :disabled="!isNameValid"
                                @click="goToStep2"
                            >
                                Next: Configure Weights →
                            </button>
                        </div>
                    </template>

                    <template v-else>
                        <h2 class="font-serif text-[22px] text-neutral-800 mb-1">
                            Configure Components
                        </h2>
                        <p class="font-sans text-sm text-neutral-600 mb-6">
                            {{ courseName }}
                        </p>

                        <ConfigureWeightsForm
                            ref="weightsFormRef"
                            v-model:lab="lab"
                            v-model:exam="exam"
                            :course-name="courseName.trim()"
                        />

                        <div v-if="dateValidationErrors.length > 0" class="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                            <ul class="list-disc pl-5 text-sm text-[#8B1A1A] font-medium space-y-1">
                                <li v-for="error in dateValidationErrors" :key="error">{{ error }}</li>
                            </ul>
                        </div>

                        <div class="flex justify-between gap-3 mt-8">
                            <button
                                type="button"
                                class="h-[38px] px-4 text-sm font-sans rounded-[6px] border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                                :disabled="saving"
                                @click="goToStep1"
                            >
                                ← Back
                            </button>

                            <div class="flex gap-3">
                                <button
                                    type="button"
                                    class="h-[38px] px-4 text-sm font-sans rounded-[6px] border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                                    :disabled="saving"
                                    @click="handleClose"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    class="h-[38px] px-4 text-sm font-sans rounded-[6px] bg-[#8B1A1A] text-white hover:bg-[#7a0002] transition-colors disabled:opacity-50 flex items-center gap-2"
                                    :disabled="!canSave || saving"
                                    :title="!canSave ? 'Weights must sum to exactly 100 and dates must be logically valid' : undefined"
                                    @click="handleSave"
                                >
                                    <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                    {{ saving ? 'Saving...' : 'Save Course' }}
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
    transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
    opacity: 0;
}
</style>