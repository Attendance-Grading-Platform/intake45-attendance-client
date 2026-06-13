<script setup lang="ts">
import type { ActiveCohort } from '@/types/cohort.types'

defineProps<{
    open: boolean
    trackName: string
    cohorts: ActiveCohort[]
    loading: boolean
    formatMonthYear: (date: string | null) => string
}>()

const emit = defineEmits<{
    close: []
}>()
</script>

<template>
    <Teleport to="body">
        <Transition name="overlay">
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                @click.self="emit('close')"
            >
                <div
                    class="w-full max-w-3xl bg-white rounded-xl border border-gray-100 shadow-sm max-h-[85vh] flex flex-col"
                    role="dialog"
                    aria-modal="true"
                >
                    <div class="p-6 border-b border-gray-100">
                        <h2 class="text-lg font-bold text-gray-900">
                            {{ trackName }} — Cohort History
                        </h2>
                    </div>

                    <div class="p-6 overflow-y-auto flex-1">
                        <div v-if="loading" class="text-sm text-gray-400 py-8 text-center">
                            Loading history…
                        </div>

                        <table v-else-if="cohorts.length" class="w-full text-left font-sans text-sm">
                            <thead class="text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th class="pb-3 font-medium">Cohort Name</th>
                                    <th class="pb-3 font-medium">Status</th>
                                    <th class="pb-3 font-medium">Students</th>
                                    <th class="pb-3 font-medium">Started</th>
                                    <th class="pb-3 font-medium">Ended</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                <tr v-for="cohort in cohorts" :key="cohort.id" class="hover:bg-gray-50">
                                    <td class="py-3 font-medium text-gray-900">{{ cohort.name }}</td>
                                    <td class="py-3">
                                        <span
                                            class="text-xs rounded-full px-2 py-0.5 capitalize"
                                            :class="cohort.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'"
                                        >
                                            {{ cohort.status }}
                                        </span>
                                    </td>
                                    <td class="py-3 text-gray-500 tabular-nums">{{ cohort.students_count }}</td>
                                    <td class="py-3 text-gray-500">{{ formatMonthYear(cohort.started_at) }}</td>
                                    <td class="py-3 text-gray-500">
                                        {{ cohort.ended_at ? formatMonthYear(cohort.ended_at) : '—' }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <p v-else class="text-sm text-gray-400 py-8 text-center">
                            No cohort history for this track.
                        </p>
                    </div>

                    <div class="p-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="button"
                            class="h-[38px] px-4 text-sm font-sans rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                            @click="emit('close')"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from,
.overlay-leave-to { opacity: 0; }
</style>
