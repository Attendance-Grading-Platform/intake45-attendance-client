<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useTracks } from '@/composables/useTracks'
import TrackHistoryModal from '@/components/branch-manager/TrackHistoryModal.vue'
import type { ActiveCohort, Track } from '@/types/cohort.types'

const router = useRouter()
const {
    tracks,
    loading,
    error,
    totalStudents,
    activeCohortsCount,
    hasClosedCohorts,
    fetchTracks,
    fetchTrackHistory,
} = useTracks()

const historyOpen = ref(false)
const historyLoading = ref(false)
const historyTrackName = ref('')
const historyCohorts = ref<ActiveCohort[]>([])

function formatDate(date: string | null | undefined): string {
    if (!date) return '—'
    return dayjs(date).format('MMM D, YYYY')
}

function formatMonthYear(date: string | null): string {
    if (!date) return '—'
    return dayjs(date).format('MMM YYYY')
}

function formatEndDate(cohort: ActiveCohort): string {
    if (!cohort.ended_at) return 'Ongoing'
    return `Ends: ${formatDate(cohort.ended_at)}`
}

function pastCohortsLabel(track: Track): string {
    const past = track.cohorts_count - (track.active_cohort ? 1 : 0)
    if (past <= 0) return ''
    return past === 1 ? '1 previous cohort' : `${past} previous cohorts`
}

function goToNewCohort(): void {
    router.push({ name: 'branch-manager-cohorts' })
}

function goToCohortDetail(cohortId: number): void {
    router.push({ name: 'branch-manager-cohort-detail', params: { cohortId } })
}

async function openHistory(track: Track): Promise<void> {
    historyTrackName.value = track.name
    historyCohorts.value = []
    historyOpen.value = true
    historyLoading.value = true

    try {
        historyCohorts.value = await fetchTrackHistory(track.id)
    } finally {
        historyLoading.value = false
    }
}

function closeHistory(): void {
    historyOpen.value = false
}

onMounted(() => fetchTracks())
</script>

<template>
    <div class="min-h-full bg-gray-50 p-6">
        <!-- Header -->
        <div class="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
                <p class="text-xs uppercase tracking-widest text-gray-400 mb-1">Branch overview</p>
                <h1 class="text-2xl font-bold text-gray-900">Tracks &amp; Cohorts</h1>
            </div>
            <button
                type="button"
                class="bg-[#8B1A1A] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7a0002] transition-colors"
                @click="goToNewCohort"
            >
                + New Cohort
            </button>
        </div>

        <!-- Error -->
        <div
            v-if="error && !loading"
            class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex flex-wrap items-center justify-between gap-3"
        >
            <span>{{ error }}</span>
            <button
                type="button"
                class="text-sm font-medium text-[#8B1A1A] hover:underline"
                @click="fetchTracks"
            >
                Retry
            </button>
        </div>

        <!-- Stats -->
        <div v-if="!loading && !error" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ tracks.length }}</p>
                <p class="text-xs text-gray-400 uppercase mt-1">Total Tracks</p>
            </div>
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ activeCohortsCount }}</p>
                <p class="text-xs text-gray-400 uppercase mt-1">Active Cohorts</p>
            </div>
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p class="text-2xl font-bold text-gray-900 tabular-nums">{{ totalStudents }}</p>
                <p class="text-xs text-gray-400 uppercase mt-1">Total Students</p>
            </div>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
                v-for="n in 2"
                :key="n"
                class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse"
            >
                <div class="h-5 bg-gray-200 rounded w-2/3 mb-4" />
                <div class="h-4 bg-gray-100 rounded w-1/4 mb-6" />
                <div class="space-y-3">
                    <div class="h-4 bg-gray-100 rounded w-full" />
                    <div class="h-4 bg-gray-100 rounded w-3/4" />
                    <div class="h-4 bg-gray-100 rounded w-1/2" />
                </div>
                <div class="h-8 bg-gray-200 rounded-lg w-28 mt-6" />
            </div>
        </div>

        <!-- Empty -->
        <div
            v-else-if="!error && tracks.length === 0"
            class="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center"
        >
            <p class="text-gray-500">No tracks configured yet</p>
        </div>

        <!-- Tracks grid -->
        <div v-else-if="!error" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article
                v-for="track in tracks"
                :key="track.id"
                class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col"
            >
                <!-- Top -->
                <div class="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <h2 class="text-lg font-bold text-gray-900">{{ track.name }}</h2>
                    <span
                        v-if="track.active_cohort"
                        class="bg-green-100 text-green-700 text-xs rounded-full px-2 py-0.5 shrink-0"
                    >
                        ● Active
                    </span>
                    <span
                        v-else
                        class="bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5 shrink-0"
                    >
                        ○ No Active Cohort
                    </span>
                </div>

                <!-- Middle: active cohort -->
                <div v-if="track.active_cohort" class="flex-1 space-y-2 mb-6">
                    <p class="text-xs text-gray-400 uppercase tracking-wide">Cohort</p>
                    <p class="text-sm font-semibold text-gray-700">{{ track.active_cohort.name }}</p>
                    <p class="text-sm text-gray-500 flex items-center gap-1">
                        <span aria-hidden="true">👥</span>
                        {{ track.active_cohort.students_count }} students
                    </p>
                    <p class="text-sm text-gray-500 flex items-center gap-1">
                        <span aria-hidden="true">📅</span>
                        {{ formatDate(track.active_cohort.started_at) }}
                    </p>
                    <p class="text-sm text-gray-500">
                        {{ formatEndDate(track.active_cohort) }}
                    </p>
                </div>

                <!-- Middle: no active cohort -->
                <div v-else class="flex-1 mb-6">
                    <p class="text-sm text-gray-400 italic">No active cohort</p>
                    <p v-if="pastCohortsLabel(track)" class="text-sm text-gray-500 mt-2">
                        {{ pastCohortsLabel(track) }}
                    </p>
                </div>

                <!-- Bottom actions -->
                <div class="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                        v-if="track.active_cohort"
                        type="button"
                        class="bg-[#8B1A1A] text-white text-sm rounded-lg px-3 py-1.5 hover:bg-[#7a0002] transition-colors"
                        @click="goToCohortDetail(track.active_cohort!.id)"
                    >
                        View Cohort →
                    </button>
                    <button
                        type="button"
                        class="border border-[#8B1A1A] text-[#8B1A1A] text-sm rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
                        @click="goToNewCohort"
                    >
                        Create Cohort
                    </button>
                    <button
                        v-if="track.cohorts_count > 0"
                        type="button"
                        class="text-sm text-gray-400 hover:text-gray-600 underline"
                        @click="openHistory(track)"
                    >
                        View History
                    </button>
                </div>
            </article>
        </div>

        <!-- Closed cohorts note -->
        <p
            v-if="!loading && !error && tracks.length > 0 && !hasClosedCohorts"
            class="mt-8 text-sm text-gray-400 text-center"
        >
            No closed cohorts yet
        </p>

        <TrackHistoryModal
            :open="historyOpen"
            :track-name="historyTrackName"
            :cohorts="historyCohorts"
            :loading="historyLoading"
            :format-month-year="formatMonthYear"
            @close="closeHistory"
        />
    </div>
</template>
