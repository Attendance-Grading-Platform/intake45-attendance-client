<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useCohortDetail } from '@/composables/useCohortDetail'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES } from '@/constants/roles'

const auth = useAuthStore()

// ── Route & Router ─────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const cohortId = Number(route.params.cohortId)

// ── Composable ─────────────────────────────────────────────────
const { cohort, loading, error, fetchCohort, closeCohort } = useCohortDetail(cohortId)

// ── Dialog state ───────────────────────────────────────────────
const showCloseDialog = ref(false)
const isClosing = ref(false)

// ── Computed: Header ───────────────────────────────────────────
const formattedStartDate = computed(() =>
    cohort.value ? dayjs(cohort.value.started_at).format('MMM D, YYYY') : ''
)

// ── Computed: Quick Stats ──────────────────────────────────────
const totalCourses = computed(() => cohort.value?.courses.length ?? 0)

const coursesConfigured = computed(() =>
    cohort.value?.courses.filter(c => c.components.length > 0).length ?? 0
)

const coursesReady = computed(() =>
    cohort.value?.courses.filter(c =>
        c.components.reduce((sum, comp) => sum + comp.weight, 0) === 100
    ).length ?? 0
)

const stats = computed(() => [
    { label: 'Total Students', value: cohort.value?.students_count ?? 0 },
    { label: 'Total Courses', value: totalCourses.value },
    { label: 'Courses Configured', value: coursesConfigured.value },
    { label: 'Courses Ready', value: coursesReady.value },
])

// ── Computed: Per-Course helpers ───────────────────────────────
const courseRows = computed(() =>
    cohort.value?.courses.map(course => {
        const totalWeight = course.components.reduce((sum, c) => sum + c.weight, 0)
        const isValid = totalWeight === 100

        // weight bar: each segment is a percentage of its weight
        const segments = course.components.map((c, i) => ({
            label: c.type === 'lab_deliverable' ? 'Lab Deliverables' : 'Final Exam / Project',
            weight: c.weight,
            percent: c.weight,
            color: i % 2 === 0 ? '#940002' : '#C9BDB8',
            dueDate: c.due_date ? dayjs(c.due_date).format('MMM D, YYYY') : 'Not set',
            type: c.type,
        }))

        return { ...course, totalWeight, isValid, segments }
    }) ?? []
)

// ── Actions ────────────────────────────────────────────────────
async function handleConfirmClose() {
    isClosing.value = true
    try {
        await closeCohort()
        showCloseDialog.value = false
    } finally {
        isClosing.value = false
    }
}

// ── Nav: Quick Links ───────────────────────────────────────────
const quickLinks = computed(() => {
    if (auth.role === ROLES.BRANCH_MANAGER) {
        return [
            { label: 'View Tracks', icon: '🛤️', to: { name: 'branch-manager-tracks' } },
            { label: 'Billing Data', icon: '💰', to: { name: 'branch-manager-billing' } },
            { label: 'Analytics', icon: '📈', to: { name: 'branch-manager-analytics' } },
            { label: 'All Cohorts', icon: '📂', to: { name: 'branch-manager-cohorts' } },
        ]
    }
    return [
        { label: 'Manage Students', icon: '👥', to: { name: 'track-admin-students' } },
        { label: 'Manage Lab Groups', icon: '🏫', to: { name: 'track-admin-lab-groups' } },
        { label: 'View Grades', icon: '📊', to: { name: 'track-admin-grades' } },
        { label: 'Schedule Engagements', icon: '📅', to: { name: 'track-admin-engagements' } },
    ]
})

// ── Init ───────────────────────────────────────────────────────
onMounted(fetchCohort)
</script>

<template>
    <!-- ── Page shell ─────────────────────────────────────── -->
    <div class="min-h-screen bg-brand-surface p-6">

        <!-- Three-Part Page Header -->
        <div class="mb-6">
            <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
                Track Admin — Cohort Overview
            </p>
            <h1 class="font-serif text-[36px] text-neutral-800 leading-tight">
                {{ loading ? 'Loading…' : (cohort?.name ?? 'Cohort Overview') }}
            </h1>
            <hr class="mt-3 border-t border-neutral-300" />
        </div>

        <!-- ── Loading skeleton ─────────────────────────── -->
        <template v-if="loading">
            <!-- Header card skeleton -->
            <div class="bg-white rounded-[10px] border border-neutral-300 p-6 mb-6 animate-pulse">
                <div class="h-7 w-1/3 bg-neutral-200 rounded mb-3" />
                <div class="h-4 w-1/5 bg-neutral-100 rounded mb-6" />
                <div class="flex gap-6">
                    <div class="h-4 w-24 bg-neutral-100 rounded" />
                    <div class="h-4 w-24 bg-neutral-100 rounded" />
                </div>
            </div>
            <!-- Stats skeleton -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div v-for="i in 4" :key="i" class="bg-white rounded-[10px] border border-neutral-300 p-6 animate-pulse">
                    <div class="h-4 w-2/3 bg-neutral-100 rounded mb-3" />
                    <div class="h-8 w-1/3 bg-neutral-200 rounded" />
                </div>
            </div>
            <!-- Courses skeleton -->
            <div class="bg-white rounded-[10px] border border-neutral-300 p-6 animate-pulse">
                <div class="h-5 w-1/4 bg-neutral-200 rounded mb-4" />
                <div class="h-4 w-full bg-neutral-100 rounded mb-2" />
                <div class="h-4 w-4/5 bg-neutral-100 rounded mb-2" />
                <div class="h-4 w-3/5 bg-neutral-100 rounded" />
            </div>
        </template>

        <!-- ── Error states ──────────────────────────────── -->
        <template v-else-if="error">
            <div class="flex flex-col items-center justify-center py-24 text-center">
                <div class="w-16 h-16 rounded-full bg-danger-light flex items-center justify-center text-3xl mb-6">
                    <span v-if="error === 'not_found'">🔍</span>
                    <span v-else-if="error === 'forbidden'">🔒</span>
                    <span v-else>⚠️</span>
                </div>
                <h2 class="font-serif text-[26px] text-neutral-800 mb-2">
                    <template v-if="error === 'not_found'">Cohort Not Found</template>
                    <template v-else-if="error === 'forbidden'">Access Denied</template>
                    <template v-else>Connection Error</template>
                </h2>
                <p class="font-sans text-sm text-neutral-600 mb-8">
                    <template v-if="error === 'not_found'">The cohort you're looking for doesn't exist.</template>
                    <template v-else-if="error === 'forbidden'">You don't have access to this cohort.</template>
                    <template v-else>Could not reach the server. Please try again.</template>
                </p>
                <div class="flex gap-3">
                    <button
                        v-if="error === 'network'"
                        class="h-[38px] px-5 text-sm font-sans rounded-[6px] bg-brand-red text-brand-surface hover:bg-[#7a0002] transition-colors"
                        @click="fetchCohort"
                    >
                        Retry
                    </button>
                    <button
                        class="h-[38px] px-5 text-sm font-sans rounded-[6px] border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                        @click="router.back()"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </template>

        <!-- ── Main Content ──────────────────────────────── -->
        <template v-else-if="cohort">

            <!-- 1. Cohort Header Card -->
            <div class="bg-white rounded-[10px] border border-neutral-300 p-6 mb-6">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    <!-- Left: Name + track + meta -->
                    <div>
                        <h2 class="font-serif text-[26px] text-neutral-800 leading-tight mb-1">
                            {{ cohort.name }}
                        </h2>
                        <p class="font-sans text-sm text-[#666666] mb-4">
                            {{ cohort.track.name }}
                        </p>

                        <div class="flex flex-wrap items-center gap-4 text-sm font-sans text-[#666666]">
                            <!-- Status badge -->
                            <span
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                :class="cohort.status === 'active'
                                    ? 'bg-[#D1FAE5] text-[#2D6A4F]'
                                    : 'bg-neutral-100 text-neutral-500'"
                            >
                                {{ cohort.status === 'active' ? 'Active' : 'Closed' }}
                            </span>
                            <span>Started {{ formattedStartDate }}</span>
                            <span>{{ cohort.students_count }} students enrolled</span>
                        </div>
                    </div>

                    <!-- Right: Close Cohort button -->
                    <div v-if="cohort.status === 'active'" class="flex-shrink-0">
                        <button
                            class="h-[38px] px-4 text-sm font-sans rounded-[6px] border border-danger text-danger hover:bg-danger-light transition-colors"
                            @click="showCloseDialog = true"
                        >
                            Close Cohort
                        </button>
                    </div>
                </div>
            </div>

            <!-- 2. Quick Stats Row -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                    v-for="stat in stats"
                    :key="stat.label"
                    class="bg-white rounded-[10px] border border-neutral-300 p-6"
                >
                    <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-2">
                        {{ stat.label }}
                    </p>
                    <p class="font-sans text-[32px] font-medium text-neutral-800 tabular-nums leading-none">
                        {{ stat.value }}
                    </p>
                </div>
            </div>

            <!-- 3. Courses Section -->
            <div class="bg-white rounded-[10px] border border-neutral-300 p-6 mb-6">
                <h3 class="font-sans text-[18px] font-medium text-neutral-800 mb-5">
                    Courses &amp; Grade Weights
                </h3>

                <!-- Empty state -->
                <div v-if="courseRows.length === 0" class="py-12 flex flex-col items-center text-center">
                    <div class="text-4xl mb-4">📚</div>
                    <p class="font-sans text-sm text-[#666666] mb-4">No courses configured yet</p>
                    <router-link
                        :to="{ name: 'track-admin-courses' }"
                        class="h-[38px] inline-flex items-center px-5 text-sm font-sans rounded-[6px] bg-brand-red text-brand-surface hover:bg-[#7a0002] transition-colors"
                    >
                        Add First Course
                    </router-link>
                </div>

                <!-- Course cards -->
                <div v-else class="space-y-6">
                    <div
                        v-for="course in courseRows"
                        :key="course.id"
                        class="border border-neutral-300 rounded-[10px] p-5"
                    >
                        <!-- Course header row -->
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                            <h4 class="font-sans font-medium text-[15px] text-neutral-800">
                                {{ course.name }}
                            </h4>

                            <!-- Weight sum indicator -->
                            <div class="flex items-center gap-2 text-sm font-sans">
                                <span v-if="course.isValid" class="text-[#2D6A4F] font-medium flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                                    100 / 100 ✓
                                </span>
                                <span v-else class="text-danger font-medium flex items-center gap-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                                    {{ course.totalWeight }} / 100 — Must equal 100
                                </span>
                            </div>
                        </div>

                        <!-- Visual weight bar -->
                        <div v-if="course.segments.length > 0" class="mb-4">
                            <div class="flex h-3 rounded-full overflow-hidden">
                                <div
                                    v-for="(seg, i) in course.segments"
                                    :key="i"
                                    :style="{ width: seg.percent + '%', backgroundColor: seg.color }"
                                    :title="`${seg.label}: ${seg.weight}%`"
                                />
                                <!-- Remainder bar if total < 100 -->
                                <div
                                    v-if="course.totalWeight < 100"
                                    :style="{ width: (100 - course.totalWeight) + '%' }"
                                    class="bg-neutral-200"
                                />
                            </div>
                        </div>

                        <!-- No components warning -->
                        <div v-if="course.segments.length === 0" class="mb-4 p-3 rounded-[6px] bg-[#FEF3C7] border border-[#92400E]/20">
                            <p class="text-xs font-sans text-[#92400E]">
                                ⚠️ No components — students cannot be graded yet
                            </p>
                        </div>

                        <!-- Components table -->
                        <div v-else class="overflow-x-auto">
                            <table class="w-full text-sm font-sans">
                                <thead>
                                    <tr>
                                        <th class="pb-2 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal border-b border-neutral-300">Component</th>
                                        <th class="pb-2 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal border-b border-neutral-300">Weight</th>
                                        <th class="pb-2 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal border-b border-neutral-300">Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr
                                        v-for="(seg, i) in course.segments"
                                        :key="i"
                                        class="hover:bg-[#F5EDEA] transition-colors"
                                    >
                                        <td class="py-2.5 pr-4 text-neutral-800 border-b border-neutral-300">{{ seg.label }}</td>
                                        <td class="py-2.5 text-right tabular-nums border-b border-neutral-300 text-neutral-600">{{ seg.weight }} pts</td>
                                        <td class="py-2.5 text-right tabular-nums border-b border-neutral-300 text-neutral-600">{{ seg.dueDate }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. Quick Navigation -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <router-link
                    v-for="link in quickLinks"
                    :key="link.label"
                    :to="link.to"
                    class="bg-white rounded-[10px] border border-neutral-300 p-5 flex flex-col items-center justify-center gap-2 hover:bg-[#F5EDEA] hover:border-brand-red transition-colors cursor-pointer text-center"
                >
                    <span class="text-2xl">{{ link.icon }}</span>
                    <span class="font-sans text-sm font-medium text-neutral-700">{{ link.label }}</span>
                </router-link>
            </div>

        </template>
    </div>

    <!-- Confirm Close Dialog -->
    <ConfirmDialog
        :open="showCloseDialog"
        title="Close Cohort"
        message="Are you sure you want to close this cohort? This action cannot be undone."
        confirm-label="Close Cohort"
        :loading="isClosing"
        @confirm="handleConfirmClose"
        @cancel="showCloseDialog = false"
    />
</template>
