<script setup lang="ts">
/**
 * ============================================================================
 * AccountsPage.vue
 * ============================================================================
 * The primary dashboard for Branch Managers to view, search, and manage 
 * platform identities. It implements an extracted AccountFormModal to keep
 * state clean and separated.
 */

import { ref, computed, onMounted } from 'vue'
import TextInput from '@/components/forms/TextInput.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import RoleBadge from '@/components/shared/RoleBadge.vue'
import AccountFormModal from '@/components/forms/AccountFormModal.vue'
import api from '@/api/axios' 

interface UserAccount {
    id: number
    name: string
    email: string
    role: string
    expiry_date?: string
}

// --- Core State ---
const users = ref<UserAccount[]>([])
const cohorts = ref<{ label: string; value: number }[]>([])
const isLoading = ref(true)

// --- Search & Filter State ---
const searchQuery = ref('')
const roleFilter = ref('')

// --- Modal & Notification State ---
const isModalOpen = ref(false)
const selectedUser = ref<UserAccount | null>(null)
const successMessage = ref('')

const roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Track Admin', value: 'track_admin' },
    { label: 'Branch Manager', value: 'branch_manager' }
]

// --- Computed ---

/**
 * Real-time client-side filtering of the datatable based on 
 * the text input and role dropdown.
 */
const filteredUsers = computed(() => {
    return users.value.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                              user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
        const matchesRole = roleFilter.value ? user.role === roleFilter.value : true
        return matchesSearch && matchesRole
    })
})

// --- Methods ---

/**
 * Fetch the main dataset on load (Users + Cohorts)
 */
async function fetchData() {
    isLoading.value = true
    try {
        const userRes = await api.get('/v1/auth/users')
        users.value = userRes.data?.data || userRes.data || []

        const cohortRes = await api.get('/v1/cohorts')
        const rawCohorts = cohortRes.data?.data || cohortRes.data || []
        cohorts.value = rawCohorts.map((c: { name: string; id: number }) => ({ label: c.name, value: c.id }))
    } catch (error) {
        console.error('Failed to fetch platform data', error)
    } finally {
        isLoading.value = false
    }
}

/**
 * Triggers the modal in "Provision" context.
 */
function openCreate() {
    selectedUser.value = null
    isModalOpen.value = true
}

/**
 * Triggers the modal in "Edit" context, passing the target user.
 */
function openEdit(user: UserAccount) {
    selectedUser.value = user
    isModalOpen.value = true
}

/**
 * Fired by the child modal upon a successful POST/PUT to Laravel.
 * Closes modal, flashes success toast, and dynamically updates the table.
 */
async function onModalSuccess(message: string) {
    isModalOpen.value = false
    
    // Trigger the notification
    successMessage.value = message
    setTimeout(() => { successMessage.value = '' }, 3000)

    // Sync UI with database
    await fetchData()
}

onMounted(() => fetchData())
</script>

<template>
    <div class="max-w-7xl mx-auto p-6">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="font-serif text-3xl text-neutral-900">Account Management</h1>
                <p class="font-sans text-neutral-500 mt-1">Provision and manage platform access.</p>
            </div>
            <button 
                @click="openCreate"
                class="h-[38px] px-4 text-sm font-sans rounded-[6px] bg-[#8B1A1A] text-white hover:bg-[#7a0002] transition-colors shadow-sm"
            >
                + Provision Account
            </button>
        </div>

        <div class="flex gap-4 mb-6 bg-white p-4 rounded-card border border-neutral-200 shadow-sm">
            <div class="flex-1">
                <TextInput v-model="searchQuery" label="Search Accounts" placeholder="Search by name or email..." />
            </div>
            <div class="w-64">
                <SelectInput v-model="roleFilter" label="Filter by Role" :options="roleOptions" placeholder="All Roles" />
            </div>
        </div>

        <div class="bg-white rounded-card border border-neutral-200 shadow-sm overflow-hidden">
            <table class="w-full text-left font-sans">
                <thead class="bg-neutral-50 border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
                    <tr>
                        <th class="px-6 py-4 font-medium">Name</th>
                        <th class="px-6 py-4 font-medium">Email</th>
                        <th class="px-6 py-4 font-medium">Role</th>
                        <th class="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100">
                    <tr v-if="isLoading">
                        <td colspan="4" class="px-6 py-8 text-center text-neutral-400">Loading accounts...</td>
                    </tr>
                    <tr v-else-if="filteredUsers.length === 0">
                        <td colspan="4" class="px-6 py-8 text-center text-neutral-400">No accounts found.</td>
                    </tr>
                    <tr v-else v-for="user in filteredUsers" :key="user.id" class="hover:bg-neutral-50 transition-colors">
                        <td class="px-6 py-4 text-sm text-neutral-900 font-medium">{{ user.name }}</td>
                        <td class="px-6 py-4 text-sm text-neutral-500">{{ user.email }}</td>
                        <td class="px-6 py-4"><RoleBadge :role="user.role" /></td>
                        <td class="px-6 py-4 text-right">
                            <button @click="openEdit(user)" class="text-sm font-medium text-[#8B1A1A] hover:underline">Edit</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AccountFormModal 
            :is-open="isModalOpen" 
            :edit-user="selectedUser" 
            :cohorts="cohorts" 
            @close="isModalOpen = false" 
            @success="onModalSuccess" 
        />

        <Teleport to="body">
            <Transition name="toast">
                <div v-if="successMessage" class="fixed top-6 right-6 z-[200] flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-card shadow-lg">
                    <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <p class="font-sans font-medium text-sm">{{ successMessage }}</p>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.toast-enter-from { opacity: 0; transform: translateY(-10px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateY(-10px) scale(0.95); }
</style>