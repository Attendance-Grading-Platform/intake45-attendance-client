<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Engagement, UpcomingSession } from '@/types/engagement.types'

const props = defineProps<{
    engagements: Engagement[]
    cohortId:    number
}>()

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
}

function formatDayTime(date: string, time = '08:00'): string {
    const day = dayjs(date).format('dddd').toUpperCase()
    const [h = 8, m = 0] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    const mins = String(m).padStart(2, '0')
    return `${day} · ${hour12}:${mins} ${period}`
}

function getLocation(e: Engagement): string {
    if (e.lab_groups.length) return e.lab_groups.map(g => g.name).join(', ')
    return 'All Groups'
}

const upcomingSessions = computed((): UpcomingSession[] => {
    const today = dayjs().format('YYYY-MM-DD')
    return props.engagements
        .filter(e => e.end_date >= today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 6)
        .map(e => ({
            id:       e.id,
            title:    getEngagementTitle(e),
            date:     e.start_date,
            time:     '08:00',
            location: getLocation(e),
            type:     e.type,
        }))
})

const capacityPercent = computed(() => {
    const now = dayjs()
    const monthStart = now.startOf('month').format('YYYY-MM-DD')
    const monthEnd = now.endOf('month').format('YYYY-MM-DD')
    const today = now.format('YYYY-MM-DD')

    const inMonth = props.engagements.filter(e =>
        e.start_date <= monthEnd && e.end_date >= monthStart
    )

    if (inMonth.length === 0) return 0

    const delivered = inMonth.filter(e => e.end_date < today).length
    return Math.min(100, Math.round((delivered / inMonth.length) * 100))
})
</script>

<template>
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full">
        <h3 class="font-bold text-gray-900 mb-4">Upcoming Sessions</h3>

        <div v-if="upcomingSessions.length === 0" class="py-8 text-center">
            <p class="text-sm text-gray-400">No upcoming sessions</p>
        </div>

        <div v-else class="space-y-4">
            <div
                v-for="session in upcomingSessions"
                :key="session.id"
                class="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
            >
                <div class="flex-shrink-0 text-center w-10">
                    <p class="text-2xl font-bold text-gray-900 leading-none tabular-nums">
                        {{ dayjs(session.date).format('D') }}
                    </p>
                    <p class="text-[10px] uppercase text-gray-400 font-medium">
                        {{ dayjs(session.date).format('MMM') }}
                    </p>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-[10px] text-[#8B1A1A] font-semibold uppercase tracking-wide mb-0.5">
                        {{ formatDayTime(session.date, session.time) }}
                    </p>
                    <p class="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                        {{ session.title }}
                    </p>
                    <p class="text-xs text-gray-400 truncate">
                        {{ session.location }}
                    </p>
                </div>
            </div>
        </div>

        <div class="mt-6 pt-4 border-t border-gray-100">
            <div class="flex justify-between items-center mb-2">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Monthly Capacity
                </p>
                <p class="text-xs font-bold text-gray-700 tabular-nums">
                    {{ capacityPercent }}% Allocated
                </p>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-2">
                <div
                    class="bg-[#8B1A1A] h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${capacityPercent}%` }"
                />
            </div>
        </div>
    </div>
</template>
