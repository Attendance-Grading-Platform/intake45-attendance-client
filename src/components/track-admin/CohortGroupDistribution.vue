<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import draggable from 'vuedraggable'
import { useLabGroups } from '@/composables/useLabGroups'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import SubmitButton from '@/components/forms/SubmitButton.vue'
import type { LabGroupStudent } from '@/types/cohort.types'

const props = defineProps<{
    cohortId: number
}>()

const emit = defineEmits<{
    saved: []
}>()

// ── Composable ─────────────────────────────────────────────────
const {
    unassigned,
    groups,
    instructors,
    groupCount,
    loadingData,
    saving,
    isDirty,
    fetchAll,
    autoDistribute: runAutoDistribute,
    setGroupCount,
    saveGroups: apiSaveGroups
} = useLabGroups(props.cohortId)

// ── UI State ───────────────────────────────────────────────────
const showAutoConfirm = ref(false)
const showCountConfirm = ref(false)
const pendingGroupCount = ref<2 | 3>(3)
const editingGroupId = ref<number | null>(null)
const editGroupName = ref('')

// ── Computed: Totals ───────────────────────────────────────────
const totalStudents = computed(() => 
    unassigned.value.length + groups.value.reduce((sum, g) => sum + g.students.length, 0)
)

// ── Actions: Distribution & Count ──────────────────────────────
function handleAutoDistribute() {
    if (groups.value.some(g => g.students.length > 0)) {
        showAutoConfirm.value = true
    } else {
        runAutoDistribute()
    }
}

function confirmAutoDistribute() {
    runAutoDistribute()
    showAutoConfirm.value = false
}

function handleCountChange(n: 2 | 3) {
    if (n === groupCount.value) return
    const group3 = groups.value[2]
    if (n === 2 && groups.value.length === 3 && group3 && group3.students.length > 0) {
        pendingGroupCount.value = n
        showCountConfirm.value = true
    } else {
        setGroupCount(n)
    }
}

function confirmCountChange() {
    setGroupCount(pendingGroupCount.value)
    showCountConfirm.value = false
}

// ── Actions: Inline Editing ────────────────────────────────────
function startEditName(group: { name: string }, index: number) {
    editingGroupId.value = index
    editGroupName.value = group.name
}

function saveName(index: number) {
    if (editGroupName.value.trim() && groups.value[index]) {
        groups.value[index].name = editGroupName.value.trim()
        isDirty.value = true
    }
    editingGroupId.value = null
}

// ── Actions: Save ──────────────────────────────────────────────
const saveError = ref<string | null>(null)

async function handleSave() {
    saveError.value = null
    try {
        await apiSaveGroups()
        emit('saved')
    } catch (err) {
        saveError.value = (err as { message?: string }).message ?? 'Failed to save groups.'
    }
}

// ── Navigation Guard ───────────────────────────────────────────
onBeforeRouteLeave((to, from, next) => {
    if (isDirty.value) {
        if (window.confirm('You have unsaved changes. Leave anyway?')) {
            next()
        } else {
            next(false)
        }
    } else {
        next()
    }
})

onMounted(fetchAll)

// ── Helper: Student Tag Color ──────────────────────────────────
function getCountColorClass(count: number) {
    if (count === 0) return 'text-neutral-400'
    if (count >= 13 && count <= 17) return 'text-success font-bold'
    return 'text-warning font-bold'
}
</script>

<template>
    <div class="h-full flex flex-col overflow-hidden">
        
        <!-- ── Header ─────────────────────────────────────────── -->
        <div class="flex items-center justify-between mb-2">
            <div>
                <h3 class="font-sans text-[18px] font-medium text-neutral-800">
                    Lab Group Distribution
                </h3>
                <p class="text-xs text-neutral-500 font-sans">
                    {{ totalStudents }} students total · {{ unassigned.length }} unassigned
                </p>
            </div>

            <div class="flex items-center gap-3">
                <!-- Group Toggle -->
                <div class="flex rounded-btn border border-neutral-300 p-0.5 bg-neutral-50 overflow-hidden">
                    <button 
                        v-for="n in [2, 3] as const" 
                        :key="n"
                        class="px-4 py-1.5 text-xs font-medium rounded-btn transition-colors"
                        :class="groupCount === n 
                            ? 'bg-brand-red text-white' 
                            : 'text-neutral-600 hover:bg-neutral-200'"
                        @click="handleCountChange(n)"
                    >
                        {{ n }} Groups
                    </button>
                </div>

                <!-- Auto Distribute -->
                <button 
                    class="h-[34px] px-4 text-xs font-sans rounded-btn border border-brand-red text-brand-red hover:bg-red-50 transition-colors disabled:opacity-40"
                    :disabled="loadingData || unassigned.length === 0 && groups.every(g => g.students.length > 0)"
                    @click="handleAutoDistribute"
                >
                    Auto-Distribute
                </button>
            </div>
        </div>

        <!-- ── Warning Bar ────────────────────────────────────── -->
        <Transition name="fade">
            <div 
                v-if="unassigned.length > 0" 
                class="mb-6 p-3 rounded-badge bg-warning-light border border-warning/20 flex items-center gap-3 text-warning-dark"
            >
                <div class="w-5 h-5 flex items-center justify-center bg-warning/20 rounded-full shrink-0">⚠️</div>
                <p class="text-sm font-sans">
                    {{ unassigned.length }} students are not assigned to any group. All students must be assigned before saving.
                </p>
            </div>
        </Transition>

        <!-- ── Error Bar ──────────────────────────────────────── -->
        <Transition name="fade">
            <div v-if="saveError" class="mb-4 p-3 rounded-badge bg-danger-light border border-danger/20 text-danger text-sm font-sans">
                {{ saveError }}
            </div>
        </Transition>

        <!-- ── Distribution Columns ───────────────────────────── -->
        <div class="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4">
            
            <!-- 1. Unassigned Column -->
            <div class="flex-none w-72 flex flex-col bg-neutral-100 rounded-card border border-neutral-300">
                <div class="p-4 border-b border-neutral-300 bg-neutral-100/50 flex justify-between items-center">
                    <span class="text-sm font-sans font-medium text-neutral-600">Unassigned</span>
                    <span class="px-2 py-0.5 rounded-full bg-neutral-200 text-xs font-bold text-neutral-600">
                        {{ unassigned.length }}
                    </span>
                </div>

                <div class="flex-1 overflow-y-auto p-3">
                    <draggable 
                        v-model="unassigned" 
                        group="students" 
                        item-key="id"
                        class="min-h-full space-y-2"
                        ghost-class="opacity-40"
                        :force-fallback="true"
                        :scroll-sensitivity="100"
                        :scroll-speed="20"
                        @start="isDirty = true"
                    >
                        <template #item="{ element }: { element: LabGroupStudent }">
                            <div class="bg-white p-3 rounded-input border border-neutral-300 shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing group hover:border-brand-red transition-colors">
                                <div class="text-neutral-400 group-hover:text-brand-red">
                                    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor"><circle cx="2" cy="2" r="1.5"/><circle cx="2" cy="9" r="1.5"/><circle cx="2" cy="16" r="1.5"/><circle cx="10" cy="2" r="1.5"/><circle cx="10" cy="9" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-medium text-neutral-800 truncate">{{ element.name }}</p>
                                    <p class="text-[11px] text-neutral-500 truncate">{{ element.email }}</p>
                                </div>
                            </div>
                        </template>
                    </draggable>
                </div>
            </div>

            <!-- 2. Group Columns -->
            <div 
                v-for="(group, idx) in groups" 
                :key="idx"
                class="flex-none w-72 flex flex-col bg-white rounded-card border border-neutral-300 transition-all"
            >
                <div class="p-4 border-b border-neutral-300 bg-white">
                    <div class="flex justify-between items-start mb-2">
                        <div v-if="editingGroupId === idx" class="flex-1 mr-2">
                            <input 
                                v-model="editGroupName"
                                class="w-full px-2 py-1 text-sm font-medium font-sans border-b-2 border-brand-red focus:outline-none"
                                @blur="saveName(idx)"
                                @keydown.enter="saveName(idx)"
                            />
                        </div>
                        <h4 
                            v-else 
                            class="text-base font-sans font-medium text-neutral-800 flex-1 truncate cursor-pointer hover:text-brand-red"
                            @click="startEditName(group, idx)"
                        >
                            {{ group.name }}
                        </h4>
                        <span class="text-[11px] uppercase tracking-wider tabular-nums" :class="getCountColorClass(group.students.length)">
                            {{ group.students.length }} Students
                        </span>
                    </div>

                    <!-- Instructor Dropdown -->
                    <div class="mt-4">
                        <p class="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Instructor</p>
                        <select 
                            v-model="group.instructor"
                            class="w-full h-8 px-2 text-xs font-sans rounded-btn border border-neutral-300 bg-neutral-0 focus:border-brand-red focus:outline-none"
                            @change="isDirty = true"
                        >
                            <option :value="null">Assign instructor...</option>
                            <option 
                                v-for="ins in instructors" 
                                :key="ins.id" 
                                :value="ins"
                            >
                                {{ ins.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-3 relative group/dropzone">
                    <draggable 
                        v-model="group.students" 
                        group="students" 
                        item-key="id"
                        class="min-h-full space-y-2"
                        ghost-class="opacity-40"
                        :force-fallback="true"
                        :scroll-sensitivity="100"
                        :scroll-speed="20"
                        @start="isDirty = true"
                    >
                        <template #item="{ element }: { element: LabGroupStudent }">
                            <div class="bg-white p-3 rounded-input border border-neutral-300 shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing group hover:border-brand-red transition-colors">
                                <div class="text-neutral-400 group-hover:text-brand-red">
                                    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor"><circle cx="2" cy="2" r="1.5"/><circle cx="2" cy="9" r="1.5"/><circle cx="2" cy="16" r="1.5"/><circle cx="10" cy="2" r="1.5"/><circle cx="10" cy="9" r="1.5"/><circle cx="10" cy="16" r="1.5"/></svg>
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-medium text-neutral-800 truncate">{{ element.name }}</p>
                                    <p class="text-[11px] text-neutral-500 truncate">{{ element.email }}</p>
                                </div>
                            </div>
                        </template>

                        <template #header v-if="group.students.length === 0">
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none p-6 text-center">
                                <div class="border-2 border-dashed border-neutral-200 rounded-card w-full h-24 flex items-center justify-center">
                                    <p class="text-xs text-neutral-400 font-sans px-4">
                                        Drop students here
                                    </p>
                                </div>
                            </div>
                        </template>
                    </draggable>
                </div>
            </div>
        </div>

        <!-- ── Footer Actions ─────────────────────────────────── -->
        <div class="mt-6 pt-6 border-t border-neutral-200 flex justify-end items-center gap-4">
            <p v-if="isDirty" class="text-xs text-neutral-400 font-sans italic">
                You have unsaved changes
            </p>
            <SubmitButton 
                label="Save Groups"
                :loading="saving"
                :disabled="unassigned.length > 0 || groups.some(g => g.students.length > 0 && !g.instructor)"
                @click="handleSave"
            />
        </div>

        <!-- ── Dialogs ────────────────────────────────────────── -->
        <ConfirmDialog 
            :open="showAutoConfirm"
            title="Auto-Distribute Students"
            message="This will redistribute ALL students randomly across the groups. Current manual assignments will be cleared. Continue?"
            confirm-label="Yes, redistribute"
            @confirm="confirmAutoDistribute"
            @cancel="showAutoConfirm = false"
        />

        <ConfirmDialog 
            :open="showCountConfirm"
            title="Reduce Groups"
            message="Group 3 currently has students. They will be moved back to the unassigned list. Continue?"
            confirm-label="Yes, switch to 2"
            @confirm="confirmCountChange"
            @cancel="showCountConfirm = false"
        />
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

.cursor-grab { cursor: grab; }
.cursor-grabbing { cursor: grabbing; }

/* Custom scrollbar for column auto-layout */
::-webkit-scrollbar {
    height: 8px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #e5e5e5;
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: #d4d4d4;
}
</style>
