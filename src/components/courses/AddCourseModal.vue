<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ComponentFormState, CreateComponentPayload } from '@/types/course.types'
import ConfigureWeightsForm from '@/components/courses/ConfigureWeightsForm.vue'

const props = defineProps<{
    open: boolean
    saving: boolean
}>()

const emit = defineEmits<{
    close: []
    save: [name: string, components: CreateComponentPayload[]]
}>()

const step = ref<1 | 2>(1)
const courseName = ref('')

const lab = ref<ComponentFormState>({ included: true, weight: 50, due_date: null })
const exam = ref<ComponentFormState>({ included: true, weight: 50, due_date: null })

const weightsFormRef = ref<InstanceType<typeof ConfigureWeightsForm> | null>(null)

const isNameValid = computed(() => courseName.value.trim().length >= 2)

const totalWeight = computed(() => {
    const labW = lab.value.included ? lab.value.weight : 0
    const examW = exam.value.included ? exam.value.weight : 0
    return labW + examW
})

const canSave = computed(() => totalWeight.value === 100)

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

function buildComponents(): CreateComponentPayload[] {
    const components: CreateComponentPayload[] = []

    if (lab.value.included && lab.value.weight > 0) {
        components.push({
            type: 'lab_deliverable',
            weight: lab.value.weight,
            due_date: lab.value.due_date,
        })
    }

    if (exam.value.included && exam.value.weight > 0) {
        components.push({
            type: 'final_exam',
            weight: exam.value.weight,
            due_date: exam.value.due_date,
        })
    }

    return components
}

function handleSave() {
    if (!canSave.value || props.saving) return
    emit('save', courseName.value.trim(), buildComponents())
}

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
                    <!-- Step 1 -->
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
                                class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base focus:outline-none focus:border-brand-red"
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

                    <!-- Step 2 -->
                    <template v-else>
                        <ConfigureWeightsForm
                            ref="weightsFormRef"
                            v-model:lab="lab"
                            v-model:exam="exam"
                            :course-name="courseName.trim()"
                        />

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
                                    :title="!canSave ? 'Weights must sum to exactly 100' : undefined"
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
