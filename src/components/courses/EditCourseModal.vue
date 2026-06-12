<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Course, ComponentFormState, UpdateComponentPayload } from '@/types/course.types'
import ConfigureWeightsForm from '@/components/courses/ConfigureWeightsForm.vue'

const props = defineProps<{
    open: boolean
    course: Course | null
    saving: boolean
}>()

const emit = defineEmits<{
    close: []
    save: [updates: Array<{ id: number; data: UpdateComponentPayload }>]
}>()

const lab = ref<ComponentFormState>({ included: true, weight: 0, due_date: null })
const exam = ref<ComponentFormState>({ included: true, weight: 0, due_date: null })

function initFromCourse(course: Course) {
    const labComp = course.components.find(c => c.type === 'lab_deliverable')
    const examComp = course.components.find(c => c.type === 'final_exam')

    lab.value = {
        id: labComp?.id,
        included: (labComp?.weight ?? 0) > 0,
        weight: labComp?.weight ?? 0,
        due_date: labComp?.due_date ?? null,
        has_grades: labComp?.has_grades ?? false,
    }

    exam.value = {
        id: examComp?.id,
        included: (examComp?.weight ?? 0) > 0,
        weight: examComp?.weight ?? 0,
        due_date: examComp?.due_date ?? null,
        has_grades: examComp?.has_grades ?? false,
    }
}

const totalWeight = computed(() => {
    const labW = lab.value.included ? lab.value.weight : 0
    const examW = exam.value.included ? exam.value.weight : 0
    return labW + examW
})

const canSave = computed(() => totalWeight.value === 100)

function handleClose() {
    if (props.saving) return
    emit('close')
}

function handleSave() {
    if (!canSave.value || props.saving || !props.course) return

    const updates: Array<{ id: number; data: UpdateComponentPayload }> = []

    if (lab.value.id && !lab.value.has_grades) {
        updates.push({
            id: lab.value.id,
            data: {
                weight: lab.value.included ? lab.value.weight : 0,
                due_date: lab.value.due_date,
            },
        })
    }

    if (exam.value.id && !exam.value.has_grades) {
        updates.push({
            id: exam.value.id,
            data: {
                weight: exam.value.included ? exam.value.weight : 0,
                due_date: exam.value.due_date,
            },
        })
    }

    emit('save', updates)
}

watch(
    () => [props.open, props.course] as const,
    ([isOpen, course]) => {
        if (isOpen && course) initFromCourse(course)
    },
    { immediate: true }
)
</script>

<template>
    <Teleport to="body">
        <Transition name="overlay">
            <div
                v-if="open && course"
                class="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
                @click.self="handleClose"
            >
                <div
                    class="w-full max-w-lg bg-white rounded-card border border-neutral-300 p-6 max-h-[90vh] overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-course-title"
                >
                    <h2 id="edit-course-title" class="font-serif text-[22px] text-neutral-800 mb-1">
                        Edit Course Weights
                    </h2>
                    <p class="font-sans text-sm text-neutral-600 mb-6">
                        {{ course.name }}
                    </p>

                    <ConfigureWeightsForm
                        v-model:lab="lab"
                        v-model:exam="exam"
                        :course-name="course.name"
                    />

                    <div class="flex justify-end gap-3 mt-8">
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
                            {{ saving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
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
