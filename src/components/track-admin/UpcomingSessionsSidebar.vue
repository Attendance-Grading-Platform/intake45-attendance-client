<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Engagement, UpcomingSession } from '@/types/engagement.types'

const props = defineProps<{
    engagements: Engagement[]
    cohortId: number
}>()

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
            return `Business Session — ${e.instructor.name}`
    }
    return ''
}

function formatDayTime(date: string, time = '08:30'): string {
    const day = dayjs(date).format('dddd').toUpperCase()
    const [h = 8, m = 30] = time.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    const mins = String(m).padStart(2, '0')
    return `${day} · ${hour12}:${mins} ${period}`
}

function getLocation(e: Engagement): string {
    if (e.lab_groups.length) return e.lab_groups.map((g) => g.name).join(', ')
    if (e.cohorts?.length) return e.cohorts.map((c) => c.name).join(', ')
    return 'All groups'
}

const upcomingSessions = computed((): UpcomingSession[] => {
    const today = dayjs().format('YYYY-MM-DD')
    return props.engagements
        .filter((e) => e.end_date >= today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 6)
        .map((e) => ({
            id: e.id,
            title: getEngagementTitle(e),
            date: e.start_date,
            time: '08:30',
            location: getLocation(e),
            type: e.type,
        }))
})

const capacityPercent = computed(() => {
    const now = dayjs()
    const monthStart = now.startOf('month').format('YYYY-MM-DD')
    const monthEnd = now.endOf('month').format('YYYY-MM-DD')
    const today = now.format('YYYY-MM-DD')

    const inMonth = props.engagements.filter(
        (e) => e.start_date <= monthEnd && e.end_date >= monthStart,
    )

    if (inMonth.length === 0) return 0

    const delivered = inMonth.filter((e) => e.end_date < today).length
    return Math.min(100, Math.round((delivered / inMonth.length) * 100))
})
</script>

<template>
    <aside class="bg-white rounded-[10px] border border-[#C9BDB8] p-6 h-full flex flex-col">
        <h3 class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-5">
            Upcoming sessions
        </h3>

        <div v-if="upcomingSessions.length === 0" class="flex-1 flex items-center justify-center py-8">
            <p class="font-sans text-[14px] text-[#888888] text-center">No upcoming sessions</p>
        </div>

        <ul v-else class="flex-1 space-y-0 divide-y divide-[#C9BDB8]">
            <li
                v-for="session in upcomingSessions"
                :key="session.id"
                class="flex gap-4 py-5 first:pt-0 last:pb-0"
            >
                <div class="flex-shrink-0 w-12 text-center">
                    <p class="font-serif text-[32px] leading-none text-[#940002] tabular-nums">
                        {{ dayjs(session.date).format('D') }}
                    </p>
                    <p class="font-sans text-[10px] text-[#888888] tracking-[1.5px] uppercase mt-1">
                        {{ dayjs(session.date).format('MMM') }}
                    </p>
                </div>
                <div class="flex-1 min-w-0 pt-1">
                    <p class="font-sans text-[10px] text-[#940002] font-medium tracking-[1px] uppercase mb-1">
                        {{ formatDayTime(session.date, session.time) }}
                    </p>
                    <p class="font-serif text-[16px] text-[#940002] leading-snug mb-1 line-clamp-2">
                        {{ session.title }}
                    </p>
                    <p class="font-sans text-[12px] text-[#888888] truncate">
                        {{ session.location }}
                    </p>
                </div>
            </li>
        </ul>

        <div class="mt-6 pt-5 border-t border-[#C9BDB8]">
            <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-3">
                Monthly capacity
            </p>
            <div class="w-full h-[6px] bg-[#E6DDD4] rounded-full overflow-hidden mb-2">
                <div
                    class="h-full bg-[#940002] rounded-full transition-all duration-500"
                    :style="{ width: `${capacityPercent}%` }"
                />
            </div>
            <p class="font-sans text-[13px] text-[#666666] tabular-nums">
                {{ capacityPercent }}% allocated
            </p>
        </div>
    </aside>
</template>
