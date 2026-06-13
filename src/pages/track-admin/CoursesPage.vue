<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import { useCohortStore } from '@/stores/cohort.store'
import { useCourses } from '@/composables/useCourses'
import type { Course, CreateComponentPayload, UpdateComponentPayload } from '@/types/course.types'
import AddCourseModal from '@/components/courses/AddCourseModal.vue'
import EditCourseModal from '@/components/courses/EditCourseModal.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const cohortStore = useCohortStore()

const selectedCohortId = ref<number | null>(null)
const cohortIdRef = computed(() => selectedCohortId.value)

const {
    courses,
    loading,
    saving,
    error,
    fetchCourses,
    createCourse,
    updateComponent,
    deleteCourse,
} = useCourses(cohortIdRef)

const expandedCourseId = ref<number | null>(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingCourse = ref<Course | null>(null)

const showDeleteConfirm = ref(false)
const showDeleteBlocked = ref(false)
const courseToDelete = ref<Course | null>(null)

const activeCohort = computed(() =>
    cohortStore.cohorts.find(c => c.id === selectedCohortId.value) ?? null
)

const cohortLabel = computed(() => {
    if (!activeCohort.value) return 'Track Admin'
    return activeCohort.value.name
})

function getLabWeight(course: Course): number | null {
    const comp = course.components.find(c => c.type === 'lab_deliverable')
    return comp && comp.weight > 0 ? comp.weight : null
}

function getExamWeight(course: Course): number | null {
    const comp = course.components.find(c => c.type === 'final_exam')
    return comp && comp.weight > 0 ? comp.weight : null
}

function componentLabel(type: 'lab_deliverable' | 'final_exam'): string {
    return type === 'lab_deliverable' ? 'Lab Deliverables' : 'Final Exam / Project'
}

function formatDueDate(date: string | null): string {
    return date ? dayjs(date).format('MMM D, YYYY') : '—'
}

function toggleExpand(courseId: number) {
    expandedCourseId.value = expandedCourseId.value === courseId ? null : courseId
}

function openEdit(course: Course, event: Event) {
    event.stopPropagation()
    editingCourse.value = course
    showEditModal.value = true
}

function openDelete(course: Course, event: Event) {
    event.stopPropagation()
    courseToDelete.value = course

    if (course.components.some(c => c.has_grades)) {
        showDeleteBlocked.value = true
    } else {
        showDeleteConfirm.value = true
    }
}

async function handleCreate(name: string, components: CreateComponentPayload[]) {
    try {
        await createCourse(name, components)
        showAddModal.value = false
    } catch {
        // error surfaced via composable
    }
}

async function handleEditSave(updates: Array<{ id: number; data: UpdateComponentPayload }>) {
    try {
        for (const update of updates) {
            await updateComponent(update.id, update.data)
        }
        showEditModal.value = false
        editingCourse.value = null
    } catch {
        // error surfaced via composable
    }
}

async function handleConfirmDelete() {
    if (!courseToDelete.value) return
    const deletedId = courseToDelete.value.id
    try {
        await deleteCourse(deletedId)
        showDeleteConfirm.value = false
        courseToDelete.value = null
        if (expandedCourseId.value === deletedId) {
            expandedCourseId.value = null
        }
    } catch {
        // error surfaced via composable
    }
}

onMounted(async () => {
    if (cohortStore.cohorts.length === 0) {
        await cohortStore.fetchCohorts()
    }

    const active = cohortStore.cohorts.find(c => c.status === 'active') || cohortStore.cohorts[0]
    if (active) {
        selectedCohortId.value = active.id
    }
})

watch(selectedCohortId, (id) => {
    if (id) {
        expandedCourseId.value = null
        fetchCourses()
    }
})
</script>

<template>
    <div class="min-h-screen bg-brand-surface p-6">
        <!-- Header -->
        <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
                <p class="font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">
                    {{ cohortLabel }}
                </p>
                <h1 class="font-serif text-[36px] text-neutral-800 leading-tight">
                    Courses &amp; Grade Weights
                </h1>
                <p class="font-sans text-sm text-neutral-600 mt-2">
                    Configure courses and their grading components for this cohort
                </p>
                <hr class="mt-3 border-t border-neutral-300" />
            </div>

            <div class="flex items-center gap-3 shrink-0">
                <div v-if="cohortStore.cohorts.length > 1" class="relative">
                    <select
                        v-model="selectedCohortId"
                        class="appearance-none bg-white border border-neutral-300 rounded-input px-4 pr-10 py-2 text-sm font-sans text-neutral-800 focus:outline-none focus:border-brand-red h-input"
                    >
                        <option v-for="c in cohortStore.cohorts" :key="c.id" :value="c.id">
                            {{ c.name }}
                        </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <button
                    type="button"
                    class="h-9.5 px-4 text-sm font-sans rounded-md bg-[#8B1A1A] text-white hover:bg-[#7a0002] transition-colors whitespace-nowrap"
                    @click="showAddModal = true"
                >
                    Add Course
                </button>
            </div>
        </div>

        <!-- Error -->
        <div
            v-if="error"
            class="mb-4 px-4 py-3 rounded-md border border-danger/30 bg-danger-light text-sm font-sans text-danger"
        >
            {{ error }}
        </div>

        <!-- Table Card -->
        <div class="bg-white rounded-card border border-neutral-300 overflow-hidden">
            <!-- Loading skeleton -->
            <template v-if="loading">
                <div class="p-6 space-y-4">
                    <div v-for="i in 4" :key="i" class="flex gap-4 animate-pulse">
                        <div class="h-4 flex-1 bg-neutral-100 rounded" />
                        <div class="h-4 w-16 bg-neutral-100 rounded" />
                        <div class="h-4 w-16 bg-neutral-100 rounded" />
                        <div class="h-4 w-12 bg-neutral-100 rounded" />
                        <div class="h-4 w-16 bg-neutral-100 rounded" />
                    </div>
                </div>
            </template>

            <!-- Empty state -->
            <div
                v-else-if="courses.length === 0"
                class="py-16 flex flex-col items-center text-center px-6"
            >
                <div class="text-4xl mb-4">📚</div>
                <h2 class="font-serif text-[20px] text-neutral-800 mb-2">No courses yet</h2>
                <p class="font-sans text-sm text-neutral-600 mb-6">
                    Add your first course to get started
                </p>
                <button
                    type="button"
                    class="h-9.5 px-5 text-sm font-sans rounded-md bg-[#8B1A1A] text-white hover:bg-[#7a0002] transition-colors"
                    @click="showAddModal = true"
                >
                    Add Course
                </button>
            </div>

            <!-- Courses table -->
            <div v-else class="overflow-x-auto">
                <table class="w-full font-sans text-sm">
                    <thead>
                        <tr class="border-b border-neutral-300">
                            <th class="py-3 px-6 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                Course Name
                            </th>
                            <th class="py-3 px-4 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                Lab Deliverables Weight
                            </th>
                            <th class="py-3 px-4 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                Final Exam Weight
                            </th>
                            <th class="py-3 px-4 text-center text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                Total
                            </th>
                            <th class="py-3 px-4 text-center text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                Status
                            </th>
                            <th class="py-3 px-6 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="course in courses" :key="course.id">
                            <!-- Main row -->
                            <tr
                                class="border-b border-neutral-300 cursor-pointer hover:bg-neutral-100 transition-colors"
                                :class="expandedCourseId === course.id ? 'bg-neutral-100' : ''"
                                @click="toggleExpand(course.id)"
                            >
                                <td class="py-4 px-6 font-medium text-neutral-800">
                                    {{ course.name }}
                                </td>
                                <td class="py-4 px-4 text-right tabular-nums text-neutral-600">
                                    <template v-if="getLabWeight(course) !== null">
                                        {{ getLabWeight(course) }} pts
                                    </template>
                                    <span v-else class="text-neutral-400">—</span>
                                </td>
                                <td class="py-4 px-4 text-right tabular-nums text-neutral-600">
                                    <template v-if="getExamWeight(course) !== null">
                                        {{ getExamWeight(course) }} pts
                                    </template>
                                    <span v-else class="text-neutral-400">—</span>
                                </td>
                                <td class="py-4 px-4 text-center">
                                    <span
                                        class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tabular-nums"
                                        :class="course.total_weight === 100
                                            ? 'bg-success-light text-success'
                                            : 'bg-danger-light text-danger'"
                                    >
                                        {{ course.total_weight }}
                                    </span>
                                </td>
                                <td class="py-4 px-4 text-center">
                                    <span
                                        v-if="course.total_weight === 100"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-success-light text-success"
                                    >
                                        Ready
                                    </span>
                                    <span
                                        v-else
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-warning-light text-warning"
                                    >
                                        Incomplete
                                    </span>
                                </td>
                                <td class="py-4 px-6 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            class="p-1.5 text-neutral-500 hover:text-brand-red transition-colors rounded-md hover:bg-neutral-50"
                                            title="Edit course weights"
                                            @click="openEdit(course, $event)"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="p-1.5 text-neutral-500 hover:text-danger transition-colors rounded-md hover:bg-neutral-50"
                                            title="Delete course"
                                            @click="openDelete(course, $event)"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <!-- Expanded detail row -->
                            <tr v-if="expandedCourseId === course.id" class="border-b border-neutral-300 bg-neutral-50">
                                <td colspan="6" class="px-6 py-4">
                                    <div v-if="course.components.length === 0" class="text-sm font-sans text-neutral-500">
                                        No components configured yet.
                                    </div>
                                    <table v-else class="w-full text-sm font-sans">
                                        <thead>
                                            <tr>
                                                <th class="pb-2 text-left text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                                    Component
                                                </th>
                                                <th class="pb-2 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                                    Weight
                                                </th>
                                                <th class="pb-2 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                                    Due Date
                                                </th>
                                                <th class="pb-2 text-right text-[11px] text-[#888888] uppercase tracking-[1.5px] font-normal">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                v-for="comp in course.components"
                                                :key="comp.id"
                                                class="border-t border-neutral-300"
                                            >
                                                <td class="py-2.5 text-neutral-800">
                                                    {{ componentLabel(comp.type) }}
                                                </td>
                                                <td class="py-2.5 text-right tabular-nums text-neutral-600">
                                                    {{ comp.weight }} pts
                                                </td>
                                                <td class="py-2.5 text-right tabular-nums text-neutral-600">
                                                    {{ formatDueDate(comp.due_date) }}
                                                </td>
                                                <td class="py-2.5 text-right">
                                                    <span
                                                        v-if="comp.has_grades"
                                                        class="inline-flex items-center gap-1 text-xs text-neutral-500"
                                                    >
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                                            <path d="M7 11V7a5 5 0 0110 0v4"/>
                                                        </svg>
                                                        Locked — grades exist
                                                    </span>
                                                    <span v-else class="text-xs text-neutral-400">Editable</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Footer note -->
        <p class="mt-4 font-sans text-[11px] text-[#888888] uppercase tracking-[1.5px]">
            Weights must sum to 100 points per course (GRD-1)
        </p>

        <!-- Modals -->
        <AddCourseModal
            :open="showAddModal"
            :saving="saving"
            @close="showAddModal = false"
            @save="handleCreate"
        />

        <EditCourseModal
            :open="showEditModal"
            :course="editingCourse"
            :saving="saving"
            @close="showEditModal = false; editingCourse = null"
            @save="handleEditSave"
        />

        <ConfirmDialog
            :open="showDeleteConfirm"
            title="Delete Course"
            :message="courseToDelete ? `Delete '${courseToDelete.name}'? This will remove all its components. This cannot be undone.` : ''"
            confirm-label="Delete"
            :loading="saving"
            danger
            @confirm="handleConfirmDelete"
            @cancel="showDeleteConfirm = false; courseToDelete = null"
        />

        <ConfirmDialog
            :open="showDeleteBlocked"
            title="Cannot Delete Course"
            message="This course has grades recorded. It cannot be deleted."
            confirm-label="OK"
            hide-cancel
            @confirm="showDeleteBlocked = false; courseToDelete = null"
            @cancel="showDeleteBlocked = false; courseToDelete = null"
        />
    </div>
</template>
