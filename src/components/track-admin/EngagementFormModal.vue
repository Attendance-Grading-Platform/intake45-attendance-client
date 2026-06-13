<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import dayjs from 'dayjs'
import type {
    Engagement,
    EngagementType,
    LabGroupOption,
    Instructor,
    CreateEngagementPayload,
    UpdateEngagementPayload,
} from '@/types/engagement.types'

const props = defineProps<{
    open: boolean
    saving: boolean
    mode: 'create' | 'edit'
    engagement?: Engagement | null
    instructors: Instructor[]
    labGroups: LabGroupOption[]
    cohortId: number
    cohortName: string
    trackName: string
    otherCohorts: Array<{ id: number; name: string; track_name: string }>
    prefilledDate?: string | null
    detectConflicts: (instructorId: number, start: string, end: string, excludeId?: number) => Engagement[]
}>()

const emit = defineEmits<{
    close: []
    save: [payload: CreateEngagementPayload | { id: number; data: UpdateEngagementPayload }]
}>()

const types: { value: EngagementType; label: string }[] = [
    { value: 'lecture', label: 'Lecture' },
    { value: 'lab', label: 'Lab' },
    { value: 'business_session', label: 'Business Session' },
]

const form = reactive({
    type:              'lecture' as EngagementType,
    instructor_id:       null as number | null,
    start_date:        '',
    end_date:          '',
    hours_per_session: null as number | null,
    lab_group_ids:     [] as number[],
    extra_cohort_ids:  [] as number[],
})

const instructorSearch = ref('')
const showInstructorDropdown = ref(false)

const today = dayjs().format('YYYY-MM-DD')

const filteredInstructors = computed(() => {
    const q = instructorSearch.value.toLowerCase()
    return props.instructors.filter(i =>
        i.name.toLowerCase().includes(q) || i.email.toLowerCase().includes(q)
    )
})

const selectedInstructor = computed(() =>
    props.instructors.find(i => i.id === form.instructor_id) ?? null
)

const durationDays = computed(() => {
    if (!form.start_date || !form.end_date) return 0
    return dayjs(form.end_date).diff(dayjs(form.start_date), 'day') + 1
})

const totalHoursHint = computed(() => {
    if (!durationDays.value || !form.hours_per_session) return null
    return durationDays.value * form.hours_per_session
})

const allLabGroupsSelected = computed({
    get: () => props.labGroups.length > 0 && form.lab_group_ids.length === props.labGroups.length,
    set: (val: boolean) => {
        form.lab_group_ids = val ? props.labGroups.map(g => g.id) : []
    },
})

const conflicts = computed(() => {
    if (!form.instructor_id || !form.start_date || !form.end_date) return []
    return props.detectConflicts(
        form.instructor_id,
        form.start_date,
        form.end_date,
        props.mode === 'edit' ? props.engagement?.id : undefined,
    )
})

const isValid = computed(() => {
    if (!form.type || !form.instructor_id || !form.start_date || !form.end_date) return false
    if (form.start_date < today) return false
    if (form.end_date < form.start_date) return false
    if (!form.hours_per_session || form.hours_per_session < 1 || form.hours_per_session > 8) return false
    if (form.type === 'lab' && form.lab_group_ids.length === 0) return false
    return true
})

function resetForm() {
    form.type = 'lecture'
    form.instructor_id = null
    form.start_date = props.prefilledDate ?? today
    form.end_date = props.prefilledDate ?? today
    form.hours_per_session = 3
    form.lab_group_ids = []
    form.extra_cohort_ids = []
    instructorSearch.value = ''
    showInstructorDropdown.value = false
}

function populateFromEngagement(engagement: Engagement) {
    form.type = engagement.type
    form.instructor_id = engagement.instructor.id
    form.start_date = engagement.start_date
    form.end_date = engagement.end_date
    form.hours_per_session = engagement.hours_per_session
    form.lab_group_ids = engagement.lab_groups.map(g => g.id)
    instructorSearch.value = engagement.instructor.name
}

function selectInstructor(instructor: Instructor) {
    form.instructor_id = instructor.id
    instructorSearch.value = instructor.name
    showInstructorDropdown.value = false
}

function toggleLabGroup(id: number) {
    const idx = form.lab_group_ids.indexOf(id)
    if (idx >= 0) form.lab_group_ids.splice(idx, 1)
    else form.lab_group_ids.push(id)
}

function handleSave() {
    if (!isValid.value || !form.instructor_id || !form.hours_per_session) return

    const payload = {
        type:              form.type,
        instructor_id:     form.instructor_id,
        start_date:        form.start_date,
        end_date:          form.end_date,
        hours_per_session: form.hours_per_session,
        lab_group_ids:     form.type === 'lab' ? [...form.lab_group_ids] : [],
        cohort_ids:        form.type === 'business_session'
            ? [props.cohortId, ...form.extra_cohort_ids]
            : undefined,
    }

    if (props.mode === 'edit' && props.engagement) {
        emit('save', { id: props.engagement.id, data: payload })
    } else {
        emit('save', payload)
    }
}

function handleClose() {
    if (props.saving) return
    emit('close')
}

watch(
    () => [props.open, props.mode, props.engagement, props.prefilledDate] as const,
    ([isOpen, mode, engagement, prefilledDate]) => {
        if (!isOpen) return
        if (mode === 'edit' && engagement) populateFromEngagement(engagement)
        else {
            resetForm()
            if (prefilledDate) {
                form.start_date = prefilledDate
                form.end_date = prefilledDate
            }
        }
    },
    { immediate: true },
)
</script>

<template>
    <Teleport to="body">
        <Transition name="overlay">
            <div
                v-if="open"
                class="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                @click.self="handleClose"
            >
                <div
                    class="relative w-full max-w-lg bg-white rounded-[10px] border border-[#C9BDB8] p-6 max-h-[90vh] overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                >
                    <button
                        type="button"
                        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
                        aria-label="Close"
                        @click="handleClose"
                    >
                        ×
                    </button>

                    <div class="mb-6 pr-6">
                        <h2 class="text-xl font-bold text-gray-900">
                            {{ mode === 'edit' ? 'Edit Engagement' : 'Add Engagement' }}
                        </h2>
                        <p class="text-sm text-gray-500 mt-1">
                            Schedule a new teaching session
                        </p>
                    </div>

                    <div class="space-y-5">
                        <!-- Type -->
                        <div>
                            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
                                Engagement Type
                            </label>
                            <div class="flex flex-wrap gap-2">
                                <button
                                    v-for="t in types"
                                    :key="t.value"
                                    type="button"
                                    class="text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
                                    :class="form.type === t.value
                                        ? 'bg-[#940002] text-[#E6DDD4]'
                                        : 'border border-[#C9BDB8] text-[#666666] hover:bg-[#F5EDEA]'"
                                    @click="form.type = t.value"
                                >
                                    {{ t.label }}
                                </button>
                            </div>
                        </div>

                        <!-- Instructor -->
                        <div class="relative">
                            <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-1.5 block">
                                Instructor <span class="text-danger">*</span>
                            </label>
                            <input
                                v-model="instructorSearch"
                                type="text"
                                placeholder="Search instructor..."
                                class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base focus:outline-none focus:border-brand-red"
                                @focus="showInstructorDropdown = true"
                                @input="form.instructor_id = null"
                            />
                            <div
                                v-if="showInstructorDropdown && filteredInstructors.length > 0"
                                class="absolute z-10 mt-1 w-full bg-white border border-neutral-300 rounded-[6px] shadow-modal max-h-48 overflow-y-auto"
                            >
                                <button
                                    v-for="inst in filteredInstructors"
                                    :key="inst.id"
                                    type="button"
                                    class="w-full text-left px-3 py-2 hover:bg-neutral-100 font-sans text-sm"
                                    @click="selectInstructor(inst)"
                                >
                                    <span class="font-medium text-neutral-800">{{ inst.name }}</span>
                                    <span class="block text-xs text-neutral-500">{{ inst.email }}</span>
                                </button>
                            </div>
                            <p v-if="selectedInstructor" class="text-xs text-neutral-500 mt-1">
                                Selected: {{ selectedInstructor.email }}
                            </p>
                        </div>

                        <!-- Dates -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-1.5 block">
                                    Start Date <span class="text-danger">*</span>
                                </label>
                                <input
                                    v-model="form.start_date"
                                    type="date"
                                    :min="today"
                                    class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base focus:outline-none focus:border-brand-red"
                                />
                            </div>
                            <div>
                                <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-1.5 block">
                                    End Date <span class="text-danger">*</span>
                                </label>
                                <input
                                    v-model="form.end_date"
                                    type="date"
                                    :min="form.start_date || today"
                                    class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base focus:outline-none focus:border-brand-red"
                                />
                            </div>
                        </div>
                        <p v-if="durationDays > 0" class="text-xs font-sans text-neutral-500 -mt-2">
                            Duration: {{ durationDays }} day{{ durationDays === 1 ? '' : 's' }}
                        </p>

                        <!-- Hours -->
                        <div>
                            <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-1.5 block">
                                Hours Per Session <span class="text-danger">*</span>
                            </label>
                            <input
                                v-model.number="form.hours_per_session"
                                type="number"
                                min="1"
                                max="8"
                                placeholder="e.g. 3"
                                class="h-input w-full rounded-input border border-neutral-300 px-3 font-sans text-base tabular-nums focus:outline-none focus:border-brand-red"
                            />
                            <p v-if="totalHoursHint" class="text-xs font-sans text-neutral-500 mt-1">
                                Total hours: {{ totalHoursHint }}
                            </p>
                        </div>

                        <!-- Lab groups -->
                        <div v-if="form.type === 'lab'">
                            <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-2 block">
                                Assign to Lab Groups <span class="text-danger">*</span>
                            </label>

                            <div v-if="labGroups.length === 0" class="p-3 rounded-[6px] bg-warning-light border border-warning/20">
                                <p class="text-sm font-sans text-warning">
                                    No lab groups configured yet.
                                </p>
                                <router-link
                                    :to="{ name: 'track-admin-lab-groups', params: { cohortId } }"
                                    class="text-sm font-sans text-brand-red hover:underline mt-1 inline-block"
                                >
                                    Configure lab groups →
                                </router-link>
                            </div>

                            <template v-else>
                                <label class="flex items-center gap-2 mb-2 font-sans text-sm text-neutral-700 cursor-pointer">
                                    <input
                                        v-model="allLabGroupsSelected"
                                        type="checkbox"
                                        class="rounded border-neutral-300 text-brand-red focus:ring-0"
                                    />
                                    Select All
                                </label>
                                <div class="space-y-2 max-h-40 overflow-y-auto border border-neutral-300 rounded-[6px] p-3">
                                    <label
                                        v-for="group in labGroups"
                                        :key="group.id"
                                        class="flex items-center justify-between gap-2 font-sans text-sm cursor-pointer hover:bg-neutral-50 p-1 rounded"
                                    >
                                        <span class="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                :checked="form.lab_group_ids.includes(group.id)"
                                                class="rounded border-neutral-300 text-brand-red focus:ring-0"
                                                @change="toggleLabGroup(group.id)"
                                            />
                                            {{ group.name }}
                                        </span>
                                        <span class="text-xs text-neutral-500 tabular-nums">
                                            {{ group.student_count }} students
                                        </span>
                                    </label>
                                </div>
                            </template>
                        </div>

                        <!-- Business session tracks -->
                        <div v-if="form.type === 'business_session'">
                            <label class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-2 block">
                                Attending Tracks
                            </label>
                            <p class="text-xs font-sans text-neutral-600 mb-3">
                                Business sessions can span multiple tracks. All selected tracks' students will have attendance recorded.
                            </p>
                            <div class="space-y-2 border border-neutral-300 rounded-[6px] p-3">
                                <label class="flex items-center gap-2 font-sans text-sm text-neutral-700">
                                    <input type="checkbox" checked disabled class="rounded border-neutral-300 opacity-60" />
                                    {{ trackName }} — {{ cohortName }} (current)
                                </label>
                                <label
                                    v-for="c in otherCohorts"
                                    :key="c.id"
                                    class="flex items-center gap-2 font-sans text-sm text-neutral-700 cursor-pointer"
                                >
                                    <input
                                        v-model="form.extra_cohort_ids"
                                        type="checkbox"
                                        :value="c.id"
                                        class="rounded border-neutral-300 text-brand-red focus:ring-0"
                                    />
                                    {{ c.track_name }} — {{ c.name }}
                                </label>
                            </div>
                        </div>

                        <!-- Conflict warning -->
                        <div
                            v-if="conflicts.length > 0 && selectedInstructor"
                            class="p-3 rounded-[6px] bg-warning-light border border-warning/20"
                        >
                            <p
                                v-for="c in conflicts"
                                :key="c.id"
                                class="text-sm font-sans text-warning"
                            >
                                ⚠ {{ selectedInstructor.name }} already has an engagement from
                                {{ dayjs(c.start_date).format('MMM D, YYYY') }} to
                                {{ dayjs(c.end_date).format('MMM D, YYYY') }}.
                                You can still save but this may cause a scheduling conflict.
                            </p>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            class="h-[38px] px-4 text-sm font-sans rounded-[6px] border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                            :disabled="saving"
                            @click="handleClose"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            class="h-[38px] px-4 text-sm rounded-[6px] bg-[#940002] text-[#E6DDD4] hover:bg-[#7a0002] disabled:opacity-50 flex items-center gap-2"
                            :disabled="!isValid || saving"
                            @click="handleSave"
                        >
                            <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            {{ saving ? 'Saving...' : (mode === 'edit' ? 'Save Changes' : 'Add to Schedule') }}
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
