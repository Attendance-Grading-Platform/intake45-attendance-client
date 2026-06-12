<script setup lang="ts">
import { ref, computed, onMounted, watch, toRef } from 'vue'
import dayjs from 'dayjs'
import { useCohortStore } from '@/stores/cohort.store'
import { useEngagements } from '@/composables/useEngagements'
import type { Engagement, EngagementType, CreateEngagementPayload, UpdateEngagementPayload } from '@/types/engagement.types'
import EngagementFormModal from '@/components/track-admin/EngagementFormModal.vue'
import UpcomingSessionsSidebar from '@/components/track-admin/UpcomingSessionsSidebar.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const props = defineProps<{
    cohortId: number
}>()

const cohortStore = useCohortStore()
const cohortIdRef = toRef(props, 'cohortId')

const {
    engagements,
    labGroups,
    instructors,
    loading,
    saving,
    error,
    fetchAll,
    createEngagement,
    updateEngagement,
    deleteEngagement,
    detectConflicts,
} = useEngagements(cohortIdRef)

const MAX_BLOCKS_PER_DAY = 4
const WEEK_DAYS_COUNT = 6
const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const currentWeekStart = ref<Date>(getMonday(new Date()))
const selectedEngagement = ref<Engagement | null>(null)
const popoverPosition = ref<{ top: number; left: number } | null>(null)
const overflowPopover = ref<{ date: string; engagements: Engagement[] } | null>(null)

const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingEngagement = ref<Engagement | null>(null)
const prefilledDate = ref<string | null>(null)

const showDeleteConfirm = ref(false)
const engagementToDelete = ref<Engagement | null>(null)

function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

function toDateStr(d: Date): string {
    return dayjs(d).format('YYYY-MM-DD')
}

function nextWeek(): void {
    currentWeekStart.value = addDays(currentWeekStart.value, 7)
}

function prevWeek(): void {
    currentWeekStart.value = addDays(currentWeekStart.value, -7)
}

function goToToday(): void {
    currentWeekStart.value = getMonday(new Date())
}

const weekDays = computed(() =>
    Array.from({ length: WEEK_DAYS_COUNT }, (_, i) => addDays(currentWeekStart.value, i))
)

const weekStart = computed(() => toDateStr(weekDays.value[0]!))
const weekEnd = computed(() => toDateStr(weekDays.value[WEEK_DAYS_COUNT - 1]!))

const weekLabel = computed(() => {
    const start = dayjs(weekDays.value[0]).format('MMM D')
    const end = dayjs(weekDays.value[WEEK_DAYS_COUNT - 1]).format('MMM D, YYYY')
    return `${start} – ${end}`
})

const visibleEngagements = computed(() =>
    engagements.value.filter(e =>
        e.start_date <= weekEnd.value && e.end_date >= weekStart.value
    )
)

interface DayColumnLayout {
    dayIndex: number
    date: Date
    dateStr: string
    all: Engagement[]
    visible: Engagement[]
    overflow: number
    isEmpty: boolean
}

function getEngagementsForDay(dateStr: string): Engagement[] {
    return visibleEngagements.value
        .filter(e => dateStr >= e.start_date && dateStr <= e.end_date)
        .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id - b.id)
}

const dayColumns = computed((): DayColumnLayout[] =>
    weekDays.value.map((date, dayIndex) => {
        const dateStr = toDateStr(date)
        const all = getEngagementsForDay(dateStr)
        const visible = all.slice(0, MAX_BLOCKS_PER_DAY)
        const overflow = Math.max(0, all.length - visible.length)
        return { dayIndex, date, dateStr, all, visible, overflow, isEmpty: all.length === 0 }
    })
)

const activeCohort = computed(() =>
    cohortStore.cohorts.find(c => c.id === props.cohortId) ?? null
)

const cohortName = computed(() => activeCohort.value?.name ?? 'Cohort')
const trackName = computed(() => {
    const row = cohortStore.cohorts.find(c => c.id === props.cohortId)
    return row ? `Track ${row.track_id}` : 'Current Track'
})

const otherCohorts = computed(() =>
    cohortStore.cohorts
        .filter(c => c.id !== props.cohortId && c.status === 'active')
        .map(c => ({
            id:         c.id,
            name:       c.name,
            track_name: `Track ${c.track_id}`,
        }))
)

function isToday(day: Date): boolean {
    return dayjs(day).isSame(dayjs(), 'day')
}

function getBlockColor(type: EngagementType): string {
    const colors: Record<EngagementType, string> = {
        lecture:          'bg-[#8B1A1A] text-white',
        lab:              'bg-[#C4A882] text-[#4A3520]',
        business_session: 'bg-[#D4C5A9] text-[#4A3520]',
    }
    return colors[type]
}

function formatTime(time: string): string {
    const [h = 8, m = 0] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function formatTimeRange(engagement: Engagement): string {
    const sameDay = engagement.start_date === engagement.end_date
    if (sameDay) {
        const endHour = 8 + engagement.hours_per_session
        return `${formatTime('08:00')} - ${formatTime(`${endHour}:00`)}`
    }
    return `${dayjs(engagement.start_date).format('MMM D')} - ${dayjs(engagement.end_date).format('MMM D')}`
}

function getEngagementTitle(e: Engagement): string {
    switch (e.type) {
        case 'lecture':
            return `${e.instructor.name} — Lecture`
        case 'lab':
            if (e.lab_groups.length) {
                return `Workshop ${e.lab_groups.map(g => g.name).join(', ')}`
            }
            return `Workshop ${e.instructor.name}`
        case 'business_session':
            return `Business Session — ${e.instructor.name}`
    }
    return ''
}

function typeLabel(type: EngagementType): string {
    if (type === 'business_session') return 'Business Session'
    return type.charAt(0).toUpperCase() + type.slice(1)
}

function openCreateModal(date?: string) {
    modalMode.value = 'create'
    editingEngagement.value = null
    prefilledDate.value = date ?? null
    showModal.value = true
    closeAllPopovers()
}

function openEditModal(engagement: Engagement) {
    modalMode.value = 'edit'
    editingEngagement.value = engagement
    prefilledDate.value = null
    showModal.value = true
    closeAllPopovers()
}

function openDetail(engagement: Engagement, event: MouseEvent) {
    event.stopPropagation()
    overflowPopover.value = null
    selectedEngagement.value = engagement
    popoverPosition.value = { top: event.clientY + 8, left: event.clientX }
}

function openDayOverflow(dateStr: string, event: MouseEvent) {
    event.stopPropagation()
    selectedEngagement.value = null
    popoverPosition.value = null
    overflowPopover.value = { date: dateStr, engagements: getEngagementsForDay(dateStr) }
}

function closeAllPopovers() {
    selectedEngagement.value = null
    popoverPosition.value = null
    overflowPopover.value = null
}

function requestDelete(engagement: Engagement) {
    engagementToDelete.value = engagement
    showDeleteConfirm.value = true
    closeAllPopovers()
}

async function handleModalSave(
    payload: CreateEngagementPayload | { id: number; data: UpdateEngagementPayload }
) {
    try {
        if ('id' in payload) {
            await updateEngagement(payload.id, payload.data)
        } else {
            await createEngagement(payload)
        }
        showModal.value = false
        editingEngagement.value = null
        prefilledDate.value = null
    } catch {
        // surfaced via composable
    }
}

async function handleConfirmDelete() {
    if (!engagementToDelete.value) return
    try {
        await deleteEngagement(engagementToDelete.value.id)
        showDeleteConfirm.value = false
        engagementToDelete.value = null
    } catch {
        // surfaced via composable
    }
}

onMounted(async () => {
    if (cohortStore.cohorts.length === 0) {
        await cohortStore.fetchCohorts()
    }
    await fetchAll()
})

watch(cohortIdRef, () => fetchAll())
watch(currentWeekStart, closeAllPopovers)
</script>

<template>
    <div class="min-h-full bg-[#F5F0E8] rounded-2xl p-6" @click="closeAllPopovers">
        <!-- Page header -->
        <div class="mb-6">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Scheduling
            </p>
            <div class="flex items-center justify-between gap-4">
                <h1 class="text-2xl font-bold text-gray-900">
                    Engagements &amp; sessions
                </h1>
                <button
                    type="button"
                    class="bg-[#8B1A1A] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6F1414] shrink-0"
                    @click="openCreateModal()"
                >
                    + Add engagement
                </button>
            </div>
        </div>

        <div
            v-if="error"
            class="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700"
        >
            {{ error }}
        </div>

        <!-- Content card -->
        <div class="bg-white rounded-2xl shadow-sm p-6">
            <div v-if="loading" class="py-16 flex justify-center">
                <div class="animate-pulse space-y-4 w-full">
                    <div class="h-6 bg-gray-100 rounded w-1/3" />
                    <div class="h-48 bg-gray-50 rounded-xl" />
                </div>
            </div>

            <template v-else>
                <div class="flex gap-6">
                    <!-- Left: Calendar -->
                    <div class="flex-1 min-w-0">
                        <!-- Week navigation -->
                        <div class="flex items-center gap-3 mb-4 flex-wrap">
                            <button
                                type="button"
                                class="text-sm text-gray-500 hover:text-gray-800"
                                @click="prevWeek"
                            >
                                ← Prev Week
                            </button>
                            <span class="text-sm font-semibold text-gray-700 tabular-nums">
                                {{ weekLabel }}
                            </span>
                            <button
                                type="button"
                                class="text-sm text-gray-500 hover:text-gray-800"
                                @click="nextWeek"
                            >
                                Next Week →
                            </button>
                            <button
                                type="button"
                                class="ml-2 text-xs border border-gray-200 px-2 py-1 rounded text-gray-500 hover:bg-gray-50"
                                @click="goToToday"
                            >
                                Today
                            </button>
                        </div>

                        <!-- Day column grid -->
                        <div class="grid grid-cols-6 border border-gray-100 rounded-xl overflow-hidden">
                            <div
                                v-for="col in dayColumns"
                                :key="col.dateStr"
                                class="border-r border-gray-100 last:border-r-0 bg-white min-h-[280px] flex flex-col"
                            >
                                <!-- Day header -->
                                <div class="px-2 py-3 text-center border-b border-gray-100">
                                    <p class="text-xs uppercase font-semibold text-gray-500 tracking-wide">
                                        {{ DAY_LABELS[col.dayIndex] }}
                                    </p>
                                    <p
                                        class="text-lg tabular-nums mt-0.5"
                                        :class="isToday(col.date) ? 'text-[#8B1A1A] font-bold' : 'text-gray-800 font-medium'"
                                    >
                                        {{ dayjs(col.date).format('D') }}
                                    </p>
                                </div>

                                <!-- Blocks -->
                                <div class="flex-1 p-2 flex flex-col gap-2">
                                    <template v-if="col.isEmpty">
                                        <div
                                            class="h-20 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#8B1A1A]/30 hover:bg-[#8B1A1A]/5 transition"
                                            @click="openCreateModal(col.dateStr)"
                                        >
                                            <span class="text-gray-300 text-lg">+</span>
                                        </div>
                                    </template>

                                    <template v-else>
                                        <div
                                            v-for="engagement in col.visible"
                                            :key="`${engagement.id}-${col.dateStr}`"
                                            :class="[
                                                'rounded-lg p-2.5 cursor-pointer transition hover:opacity-90',
                                                getBlockColor(engagement.type),
                                            ]"
                                            @click="openDetail(engagement, $event)"
                                        >
                                            <p class="text-[10px] font-medium opacity-70 mb-1 truncate">
                                                {{ formatTimeRange(engagement) }}
                                            </p>
                                            <p class="text-xs font-bold leading-tight line-clamp-2">
                                                {{ getEngagementTitle(engagement) }}
                                            </p>
                                        </div>

                                        <button
                                            v-if="col.overflow > 0"
                                            type="button"
                                            class="text-xs text-[#8B1A1A] font-medium mt-auto text-left hover:underline"
                                            @click="openDayOverflow(col.dateStr, $event)"
                                        >
                                            +{{ col.overflow }} more
                                        </button>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Sidebar -->
                    <div class="w-72 flex-shrink-0 hidden lg:block">
                        <UpcomingSessionsSidebar
                            :engagements="engagements"
                            :cohort-id="cohortId"
                        />
                    </div>
                </div>

                <!-- Sidebar on mobile below calendar -->
                <div class="mt-6 lg:hidden">
                    <UpcomingSessionsSidebar
                        :engagements="engagements"
                        :cohort-id="cohortId"
                    />
                </div>
            </template>
        </div>

        <!-- Detail popover -->
        <Teleport to="body">
            <div
                v-if="selectedEngagement && popoverPosition"
                class="fixed z-modal w-72 bg-white rounded-2xl border border-gray-100 p-4 shadow-lg"
                :style="{ top: `${popoverPosition.top}px`, left: `${popoverPosition.left}px` }"
                @click.stop
            >
                <p class="font-bold text-gray-900 mb-1">
                    {{ getEngagementTitle(selectedEngagement) }}
                </p>
                <p class="text-sm text-gray-600 mb-1">
                    {{ selectedEngagement.instructor.name }}
                </p>
                <p class="text-xs text-gray-500 mb-1">
                    {{ formatTimeRange(selectedEngagement) }}
                </p>
                <p class="text-xs text-gray-500 mb-3">
                    {{ dayjs(selectedEngagement.start_date).format('MMM D, YYYY') }} –
                    {{ dayjs(selectedEngagement.end_date).format('MMM D, YYYY') }}
                </p>
                <div class="flex gap-2">
                    <button
                        type="button"
                        class="flex-1 h-[34px] text-xs rounded-lg border border-gray-200 hover:bg-gray-50"
                        @click="openEditModal(selectedEngagement)"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        class="flex-1 h-[34px] text-xs rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                        @click="requestDelete(selectedEngagement)"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <!-- Day overflow popover -->
            <div
                v-if="overflowPopover"
                class="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                @click.self="overflowPopover = null"
            >
                <div
                    class="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-5 shadow-2xl"
                    @click.stop
                >
                    <h3 class="text-base font-bold text-gray-900 mb-4">
                        All engagements — {{ dayjs(overflowPopover.date).format('ddd, MMM D, YYYY') }}
                    </h3>
                    <ul class="space-y-2 max-h-72 overflow-y-auto">
                        <li v-for="eng in overflowPopover.engagements" :key="eng.id">
                            <button
                                type="button"
                                class="w-full text-left rounded-lg p-2.5 hover:opacity-90 transition"
                                :class="getBlockColor(eng.type)"
                                @click="openEditModal(eng)"
                            >
                                <p class="text-[10px] font-medium opacity-70 mb-0.5">
                                    {{ formatTimeRange(eng) }}
                                </p>
                                <p class="text-xs font-bold leading-tight">
                                    {{ getEngagementTitle(eng) }}
                                </p>
                            </button>
                        </li>
                    </ul>
                    <button
                        type="button"
                        class="mt-4 w-full h-[36px] text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        @click="overflowPopover = null"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Teleport>

        <EngagementFormModal
            :open="showModal"
            :saving="saving"
            :mode="modalMode"
            :engagement="editingEngagement"
            :instructors="instructors"
            :lab-groups="labGroups"
            :cohort-id="cohortId"
            :track-name="trackName"
            :cohort-name="cohortName"
            :other-cohorts="otherCohorts"
            :prefilled-date="prefilledDate"
            :detect-conflicts="detectConflicts"
            @close="showModal = false; editingEngagement = null; prefilledDate = null"
            @save="handleModalSave"
        />

        <ConfirmDialog
            :open="showDeleteConfirm"
            title="Delete Engagement"
            :message="engagementToDelete
                ? `Delete this ${typeLabel(engagementToDelete.type).toLowerCase()} engagement? This cannot be undone.`
                : ''"
            confirm-label="Delete"
            :loading="saving"
            danger
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false; engagementToDelete = null"
        />
    </div>
</template>
