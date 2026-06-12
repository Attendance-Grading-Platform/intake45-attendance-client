<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { ComponentFormState } from '@/types/course.types'
import WeightValidatorBar from '@/components/courses/WeightValidatorBar.vue'

const props = defineProps<{
    lab: ComponentFormState
    exam: ComponentFormState
    courseName?: string
}>()

const emit = defineEmits<{
    'update:lab': [value: ComponentFormState]
    'update:exam': [value: ComponentFormState]
}>()

const activePreset = reactive({ value: null as string | null })

const labState = computed({
    get: () => props.lab,
    set: (v) => emit('update:lab', v),
})

const examState = computed({
    get: () => props.exam,
    set: (v) => emit('update:exam', v),
})

const totalWeight = computed(() => {
    const labW = labState.value.included ? labState.value.weight : 0
    const examW = examState.value.included ? examState.value.weight : 0
    return labW + examW
})

const isValid = computed(() => totalWeight.value === 100)

function applyPreset(lab: number, exam: number, label: string) {
    activePreset.value = label
    emit('update:lab', { ...labState.value, included: true, weight: lab })
    emit('update:exam', { ...examState.value, included: true, weight: exam })
}

function clearPreset() {
    activePreset.value = 'Custom'
}

function updateLab(field: keyof ComponentFormState, value: boolean | number | string | null) {
    const next = { ...labState.value, [field]: value }
    if (field === 'included' && !value) next.weight = 0
    if (field === 'weight' || field === 'included') clearPreset()
    emit('update:lab', next)
}

function updateExam(field: keyof ComponentFormState, value: boolean | number | string | null) {
    const next = { ...examState.value, [field]: value }
    if (field === 'included' && !value) next.weight = 0
    if (field === 'weight' || field === 'included') clearPreset()
    emit('update:exam', next)
}

defineExpose({ totalWeight, isValid })

watch(
    () => [props.lab.weight, props.exam.weight, props.lab.included, props.exam.included],
    () => {
        if (activePreset.value && activePreset.value !== 'Custom') {
            const presets: Record<string, [number, number]> = {
                '50 / 50': [50, 50],
                '40 / 60': [40, 60],
                '30 / 70': [30, 70],
            }
            const preset = presets[activePreset.value]
            if (preset) {
                const [l, e] = preset
                const labW = props.lab.included ? props.lab.weight : 0
                const examW = props.exam.included ? props.exam.weight : 0
                if (labW !== l || examW !== e) activePreset.value = 'Custom'
            }
        }
    }
)
</script>

<template>
    <div class="space-y-6">
        <div v-if="courseName">
            <h3 class="font-sans text-[18px] font-medium text-neutral-800">
                Configure Grade Weights for {{ courseName }}
            </h3>
            <p class="font-sans text-sm text-neutral-600 mt-1">
                Weights must sum to exactly 100 points (GRD-1, GRD-2)
            </p>
        </div>

        <!-- Lab Deliverables -->
        <div class="border border-neutral-300 rounded-[10px] p-4 space-y-3">
            <div class="flex items-center justify-between gap-4">
                <span class="font-sans text-sm font-medium text-neutral-800">Lab Deliverables</span>
                <label
                    v-if="!lab.has_grades"
                    class="flex items-center gap-2 font-sans text-sm text-neutral-600 cursor-pointer"
                >
                    <input
                        type="checkbox"
                        :checked="lab.included"
                        class="rounded border-neutral-300 text-brand-red focus:ring-0 focus:outline-none"
                        @change="updateLab('included', ($event.target as HTMLInputElement).checked)"
                    />
                    Include this component
                </label>
                <span
                    v-else
                    class="flex items-center gap-1.5 text-xs font-sans text-neutral-500"
                    title="This component has grades recorded and cannot be modified"
                >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Locked — grades exist
                </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px]">Weight</label>
                    <input
                        type="number"
                        min="1"
                        max="99"
                        :value="lab.weight"
                        :disabled="lab.has_grades || !lab.included"
                        class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base tabular-nums focus:outline-none focus:border-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                        @input="updateLab('weight', Number(($event.target as HTMLInputElement).value))"
                    />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px]">Due Date (optional)</label>
                    <input
                        type="date"
                        :value="lab.due_date ?? ''"
                        :disabled="lab.has_grades || !lab.included"
                        class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base focus:outline-none focus:border-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                        @input="updateLab('due_date', ($event.target as HTMLInputElement).value || null)"
                    />
                </div>
            </div>
        </div>

        <!-- Final Exam / Project -->
        <div class="border border-neutral-300 rounded-[10px] p-4 space-y-3">
            <div class="flex items-center justify-between gap-4">
                <span class="font-sans text-sm font-medium text-neutral-800">Final Exam / Project</span>
                <label
                    v-if="!exam.has_grades"
                    class="flex items-center gap-2 font-sans text-sm text-neutral-600 cursor-pointer"
                >
                    <input
                        type="checkbox"
                        :checked="exam.included"
                        class="rounded border-neutral-300 text-brand-red focus:ring-0 focus:outline-none"
                        @change="updateExam('included', ($event.target as HTMLInputElement).checked)"
                    />
                    Include this component
                </label>
                <span
                    v-else
                    class="flex items-center gap-1.5 text-xs font-sans text-neutral-500"
                    title="This component has grades recorded and cannot be modified"
                >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Locked — grades exist
                </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px]">Weight</label>
                    <input
                        type="number"
                        min="1"
                        max="99"
                        :value="exam.weight"
                        :disabled="exam.has_grades || !exam.included"
                        class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base tabular-nums focus:outline-none focus:border-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                        @input="updateExam('weight', Number(($event.target as HTMLInputElement).value))"
                    />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px]">Due Date (optional)</label>
                    <input
                        type="date"
                        :value="exam.due_date ?? ''"
                        :disabled="exam.has_grades || !exam.included"
                        class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base focus:outline-none focus:border-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                        @input="updateExam('due_date', ($event.target as HTMLInputElement).value || null)"
                    />
                </div>
            </div>
        </div>

        <!-- Presets -->
        <div class="flex flex-wrap gap-2">
            <button
                v-for="preset in ['50 / 50', '40 / 60', '30 / 70', 'Custom']"
                :key="preset"
                type="button"
                class="h-[34px] px-3 text-xs font-sans rounded-[6px] border transition-colors"
                :class="activePreset.value === preset
                    ? 'border-brand-red bg-neutral-100 text-brand-red'
                    : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50'"
                @click="preset === 'Custom'
                    ? (activePreset.value = 'Custom')
                    : applyPreset(
                        preset === '50 / 50' ? 50 : preset === '40 / 60' ? 40 : 30,
                        preset === '50 / 50' ? 50 : preset === '40 / 60' ? 60 : 70,
                        preset
                    )"
            >
                {{ preset }}
            </button>
        </div>

        <!-- Weight validator -->
        <WeightValidatorBar :total="totalWeight" />
    </div>
</template>
