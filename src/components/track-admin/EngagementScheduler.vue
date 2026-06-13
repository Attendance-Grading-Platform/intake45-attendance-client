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
    Array.from({ length: WEEK_DAYS_COUNT }, (_, i) => addDays(currentWeekStart.value, i)),
)

const weekStart = computed(() => toDateStr(weekDays.value[0]!))
const weekEnd = computed(() => toDateStr(weekDays.value[WEEK_DAYS_COUNT - 1]!))

const weekLabel = computed(() => {
    const start = dayjs(weekDays.value[0]).format('MMM D')
    const end = dayjs(weekDays.value[WEEK_DAYS_COUNT - 1]).format('MMM D, YYYY')
    return `${start} – ${end}`
})

const visibleEngagements = computed(() =>
    engagements.value.filter((e) => e.start_date <= weekEnd.value && e.end_date >= weekStart.value),
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
        .filter((e) => dateStr >= e.start_date && dateStr <= e.end_date)
        .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id - b.id)
}

const dayColumns = computed((): DayColumnLayout[] =>
    weekDays.value.map((date, dayIndex) => {
        const dateStr = toDateStr(date)
        const all = getEngagementsForDay(dateStr)
        const visible = all.slice(0, MAX_BLOCKS_PER_DAY)
        const overflow = Math.max(0, all.length - visible.length)
        return { dayIndex, date, dateStr, all, visible, overflow, isEmpty: all.length === 0 }
    }),
)

const activeCohort = computed(() =>
    cohortStore.cohorts.find((c) => c.id === props.cohortId) ?? null,
)

const cohortName = computed(() => activeCohort.value?.name ?? 'Cohort')
const trackName = computed(() => {
    const row = cohortStore.cohorts.find((c) => c.id === props.cohortId)
    return row ? `Track ${row.track_id}` : 'Current Track'
})

const otherCohorts = computed(() =>
    cohortStore.cohorts
        .filter((c) => c.id !== props.cohortId && c.status === 'active')
        .map((c) => ({
            id: c.id,
            name: c.name,
            track_name: `Track ${c.track_id}`,
        })),
)

function isToday(day: Date): boolean {
    return dayjs(day).isSame(dayjs(), 'day')
}

function getBlockClasses(type: EngagementType): string {
    const base = 'rounded-[8px] px-3 py-3 cursor-pointer transition-all hover:brightness-[0.97] border'
    const variants: Record<EngagementType, string> = {
        lecture: `${base} bg-[#940002] border-[#940002] text-[#E6DDD4]`,
        lab: `${base} bg-[#E6DDD4] border-[#C9BDB8] text-[#1A0000]`,
        business_session: `${base} bg-[#F5EDEA] border-[#C9BDB8] text-[#1A0000]`,
    }
    return variants[type]
}

function blockMinHeight(hours: number): string {
    return `${Math.max(80, Math.min(160, hours * 28))}px`
}

function formatTime(time: string): string {
    const [h = 8, m = 0] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

function formatTimeRange(engagement: Engagement): string {
    const startHour = 8
    const endHour = startHour + engagement.hours_per_session
    return `${formatTime(`${startHour}:00`)} - ${formatTime(`${endHour}:00`)}`
}

function getEngagementTitle(e: Engagement): string {
    switch (e.type) {
        case 'lecture':
            return `${e.instructor.name} Lecture`
        case 'lab':
            if (e.lab_groups.length) {
                return `${e.lab_groups.map((g) => g.name).join(' · ')} Lab`
            }
            return `${e.instructor.name} Lab`
        case 'business_session':
            return `Business Session`
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
    payload: CreateEngagementPayload | { id: number; data: UpdateEngagementPayload },
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
    <div @click="closeAllPopovers">
        <!-- Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div class="flex items-center gap-2">
                <button
                    type="button"
                    class="h-[34px] px-3 font-sans text-[13px] text-[#666666] border border-[#C9BDB8] rounded-[6px] hover:bg-[#F5EDEA] transition-colors"
                    @click="prevWeek"
                >
                    ← Prev
                </button>
                <span class="font-sans text-[14px] font-medium text-[#1A0000] tabular-nums min-w-[160px] text-center">
                    {{ weekLabel }}
                </span>
                <button
                    type="button"
                    class="h-[34px] px-3 font-sans text-[13px] text-[#666666] border border-[#C9BDB8] rounded-[6px] hover:bg-[#F5EDEA] transition-colors"
                    @click="nextWeek"
                >
                    Next →
                </button>
                <button
                    type="button"
                    class="h-[34px] px-3 font-sans text-[12px] text-[#888888] hover:text-[#1A0000] transition-colors"
                    @click="goToToday"
                >
                    Today
                </button>
            </div>
            <button
                type="button"
                class="h-[38px] px-4 font-sans text-[14px] font-medium bg-[#940002] text-[#E6DDD4] rounded-[6px] hover:bg-[#7a0002] transition-colors shrink-0"
                @click="openCreateModal()"
            >
                + Add engagement
            </button>
        </div>

        <div
            v-if="error"
            class="mb-4 px-4 py-3 rounded-[6px] border border-[#991B1B] bg-[#FEE2E2] text-[14px] text-[#991B1B] font-sans"
        >
            {{ error }}
        </div>

        <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-[420px]" />
            <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 animate-pulse h-[420px] hidden lg:block" />
        </div>

        <div v-else class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
            <!-- Calendar card -->
            <section class="bg-white rounded-[10px] border border-[#C9BDB8] overflow-hidden min-w-0">
                <div class="grid grid-cols-6 divide-x divide-[#C9BDB8]">
                    <div
                        v-for="col in dayColumns"
                        :key="col.dateStr"
                        class="min-h-[360px] flex flex-col bg-white"
                    >
                        <!-- Day header -->
                        <div
                            class="px-2 py-4 text-center border-b border-[#C9BDB8]"
                            :class="isToday(col.date) ? 'bg-[#F5EDEA]' : ''"
                        >
                            <p class="font-sans text-[11px] font-medium text-[#888888] tracking-[1.5px] uppercase">
                                {{ DAY_LABELS[col.dayIndex] }}
                            </p>
                        </div>

                        <!-- Session blocks -->
                        <div class="flex-1 p-2 flex flex-col gap-2">
                            <template v-if="col.isEmpty">
                                <button
                                    type="button"
                                    class="flex-1 min-h-[80px] border border-dashed border-[#C9BDB8] rounded-[8px] flex items-center justify-center text-[#AEAEAE] hover:border-[#940002] hover:text-[#940002] hover:bg-[#F5EDEA] transition-colors"
                                    @click="openCreateModal(col.dateStr)"
                                >
                                    <span class="text-xl leading-none">+</span>
                                </button>
                            </template>

                            <template v-else>
                                <div
                                    v-for="engagement in col.visible"
                                    :key="`${engagement.id}-${col.dateStr}`"
                                    :class="[getBlockClasses(engagement.type), 'flex flex-col justify-center']"
                                    :style="{ minHeight: blockMinHeight(engagement.hours_per_session) }"
                                    @click="openDetail(engagement, $event)"
                                >
                                    <p class="font-sans text-[10px] tracking-wide opacity-80 mb-1.5 truncate">
                                        {{ formatTimeRange(engagement) }}
                                    </p>
                                    <p class="font-sans text-[13px] font-semibold leading-snug line-clamp-3">
                                        {{ getEngagementTitle(engagement) }}
                                    </p>
                                </div>

                                <button
                                    v-if="col.overflow > 0"
                                    type="button"
                                    class="font-sans text-[12px] text-[#940002] font-medium mt-auto text-left hover:underline py-1"
                                    @click="openDayOverflow(col.dateStr, $event)"
                                >
                                    +{{ col.overflow }} more
                                </button>
                            </template>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Sidebar -->
            <UpcomingSessionsSidebar
                class="hidden lg:flex"
                :engagements="engagements"
                :cohort-id="cohortId"
            />
        </div>

        <!-- Mobile sidebar -->
        <UpcomingSessionsSidebar
            v-if="!loading"
            class="mt-6 lg:hidden"
            :engagements="engagements"
            :cohort-id="cohortId"
        />

        <!-- Detail popover -->
        <Teleport to="body">
            <div
                v-if="selectedEngagement && popoverPosition"
                class="fixed z-50 w-80 bg-white rounded-[10px] border border-[#C9BDB8] p-5 shadow-lg"
                :style="{ top: `${popoverPosition.top}px`, left: `${popoverPosition.left}px` }"
                @click.stop
            >
                <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">
                    {{ typeLabel(selectedEngagement.type) }}
                </p>
                <p class="font-serif text-[20px] text-[#1A0000] mb-2 leading-tight">
                    {{ getEngagementTitle(selectedEngagement) }}
                </p>
                <p class="font-sans text-[14px] text-[#666666] mb-1">
                    {{ selectedEngagement.instructor.name }}
                </p>
                <p class="font-sans text-[13px] text-[#888888] mb-1 tabular-nums">
                    {{ formatTimeRange(selectedEngagement) }}
                </p>
                <p class="font-sans text-[13px] text-[#888888] mb-4">
                    {{ dayjs(selectedEngagement.start_date).format('MMM D, YYYY') }} –
                    {{ dayjs(selectedEngagement.end_date).format('MMM D, YYYY') }}
                </p>
                <div class="flex gap-2">
                    <button
                        type="button"
                        class="flex-1 h-[34px] text-[13px] font-sans rounded-[6px] border border-[#C9BDB8] text-[#1A0000] hover:bg-[#F5EDEA]"
                        @click="openEditModal(selectedEngagement)"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        class="flex-1 h-[34px] text-[13px] font-sans rounded-[6px] border border-[#991B1B] text-[#991B1B] hover:bg-[#FEE2E2]"
                        @click="requestDelete(selectedEngagement)"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <!-- Overflow modal — professional table layout -->
            <div
                v-if="overflowPopover"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                @click.self="overflowPopover = null"
            >
                <div
                    class="w-full max-w-lg bg-white rounded-[10px] border border-[#C9BDB8] overflow-hidden"
                    @click.stop
                >
                    <div class="px-6 py-4 border-b border-[#C9BDB8]">
                        <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">
                            All sessions
                        </p>
                        <h3 class="font-serif text-[22px] text-[#1A0000]">
                            {{ dayjs(overflowPopover.date).format('dddd, MMM D') }}
                        </h3>
                    </div>

                    <table class="w-full text-left font-sans">
                        <thead class="border-b border-[#C9BDB8] bg-[#F5EDEA]/50">
                            <tr class="text-[11px] text-[#888888] tracking-[1.5px] uppercase">
                                <th class="px-6 py-3 font-normal">Time</th>
                                <th class="px-6 py-3 font-normal">Session</th>
                                <th class="px-6 py-3 font-normal">Type</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#C9BDB8]">
                            <tr
                                v-for="eng in overflowPopover.engagements"
                                :key="eng.id"
                                class="hover:bg-[#F5EDEA] cursor-pointer transition-colors"
                                @click="openEditModal(eng)"
                            >
                                <td class="px-6 py-3 text-[13px] text-[#666666] tabular-nums whitespace-nowrap">
                                    {{ formatTimeRange(eng) }}
                                </td>
                                <td class="px-6 py-3 text-[14px] font-medium text-[#1A0000]">
                                    {{ getEngagementTitle(eng) }}
                                </td>
                                <td class="px-6 py-3">
                                    <span
                                        class="inline-flex px-2 py-0.5 rounded-[6px] text-[10px] font-medium tracking-wide uppercase border"
                                        :class="eng.type === 'lecture'
                                            ? 'bg-[#940002] text-[#E6DDD4] border-[#940002]'
                                            : 'bg-[#F5EDEA] text-[#666666] border-[#C9BDB8]'"
                                    >
                                        {{ typeLabel(eng.type) }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="px-6 py-4 border-t border-[#C9BDB8] flex justify-end">
                        <button
                            type="button"
                            class="h-[38px] px-4 text-[14px] font-sans rounded-[6px] border border-[#C9BDB8] text-[#1A0000] hover:bg-[#F5EDEA]"
                            @click="overflowPopover = null"
                        >
                            Close
                        </button>
                    </div>
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
