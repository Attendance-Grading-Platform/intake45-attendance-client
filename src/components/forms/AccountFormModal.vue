<script setup lang="ts">
/**
 * ============================================================================
 * AccountFormModal.vue
 * ============================================================================
 * A highly reusable, dynamic modal for provisioning new users or editing
 * existing ones. It strictly enforces the "Top-Down Provisioning" (SEC-1)
 * business logic, ensuring that specific roles are assigned the correct
 * relational data (e.g., Students must have a Cohort, Instructors must
 * have compensation details).
 */

import { ref, computed, watch } from 'vue'
import TextInput from '@/components/forms/TextInput.vue'
import SelectInput from '@/components/forms/SelectInput.vue'
import api from '@/api/axios'

interface EditableUser {
    id: number
    name?: string
    email?: string
    role?: string
    expiry_date?: string
    cohort_id?: number | string
    compensation_type?: string
    hourly_rate?: string | number
    fixed_salary?: string | number
    enrolled_cohorts?: Array<{ id: string | number }>
    administered_cohorts?: Array<{ id: string | number }>
}

// --- Props & Emits ---
const props = defineProps<{
    isOpen: boolean
    editUser: EditableUser | null
    cohorts: { label: string; value: number }[]
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'success', message: string): void
}>()

// --- Local State ---
const isSaving = ref(false)
const formErrors = ref<Record<string, string>>({})

// Base empty form structure
const defaultForm = {
    name: '', email: '', password: '', role: '', expiry_date: '',
    cohort_id: '', compensation_type: '', hourly_rate: '', fixed_salary: ''
}

// The reactive payload bound to our inputs
const formData = ref({ ...defaultForm })

// --- Constants ---
const roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Track Admin', value: 'track_admin' },
    { label: 'Branch Manager', value: 'branch_manager' }
]

const compensationOptions = [
    { label: 'Internal (Salaried)', value: 'internal' },
    { label: 'External (Hourly)', value: 'external' }
]

// --- Computed Properties ---

const isEditing = computed(() => !!props.editUser)
const modalTitle = computed(() => isEditing.value ? 'Edit Account' : 'Provision Account')
const submitLabel = computed(() => isEditing.value ? 'Save Changes' : 'Provision Account')

const isFormValid = computed(() => {
    if (!formData.value.name || !formData.value.email || !formData.value.role || !formData.value.expiry_date) return false

    if (!isEditing.value && !formData.value.password) return false

    if (['student', 'track_admin'].includes(formData.value.role) && !formData.value.cohort_id) return false

    if (formData.value.role === 'instructor') {
        if (!formData.value.compensation_type) return false
        if (formData.value.compensation_type === 'external' && !formData.value.hourly_rate) return false
        if (formData.value.compensation_type === 'internal' && !formData.value.fixed_salary) return false
    }

    return true
})

// --- Lifecycle Watcher ---

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        formErrors.value = {}

        if (props.editUser) {
            const user = props.editUser

            const formattedExpiry = user.expiry_date ? user.expiry_date.split('T')[0] : ''

          let currentCohortId: string | number = ''
            if (user.role === 'student' && user.enrolled_cohorts?.length) {
                currentCohortId = user.enrolled_cohorts?.[0]?.id ?? ''
            } else if (user.role === 'track_admin' && user.administered_cohorts?.length) {
                currentCohortId = user.administered_cohorts?.[0]?.id ?? ''
            }

            formData.value = {
                name: user.name ?? '',
                email: user.email ?? '',
                password: '',
                role: user.role ?? '',
               expiry_date: formattedExpiry ?? '',
                cohort_id: String(currentCohortId),
                compensation_type: user.compensation_type || '',
                hourly_rate: user.hourly_rate !== undefined && user.hourly_rate !== null ? String(user.hourly_rate) : '',
                fixed_salary: user.fixed_salary !== undefined && user.fixed_salary !== null ? String(user.fixed_salary) : ''
            }
        } else {
            formData.value = { ...defaultForm }
        }
    }
})

// --- Methods ---

function handleClose() {
    if (isSaving.value) return
    emit('close')
}

async function handleSave() {
    if (!isFormValid.value || isSaving.value) return

    isSaving.value = true
    formErrors.value = {}

    try {
        const payload: Record<string, unknown> = {
            name: formData.value.name,
            email: formData.value.email,
            role: formData.value.role,
            expiry_date: formData.value.expiry_date,
        }

        if (formData.value.password) {
            payload.password = formData.value.password
        }

        if (['student', 'track_admin'].includes(String(payload.role))) {
            payload.cohort_id = formData.value.cohort_id
        }

        if (payload.role === 'instructor') {
            payload.compensation_type = formData.value.compensation_type
            if (payload.compensation_type === 'external') payload.hourly_rate = formData.value.hourly_rate
            if (payload.compensation_type === 'internal') payload.fixed_salary = formData.value.fixed_salary
        }

        if (isEditing.value && props.editUser) {
            await api.put(`/v1/auth/users/${props.editUser.id}`, payload)
            emit('success', 'User updated successfully!')
        } else {
            await api.post('/v1/auth/users', payload)
            emit('success', 'User provisioned successfully!')
        }

    } catch (error) {
        console.error('Save operation failed:', error)
        const e = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }

        if (e.response?.status === 422) {
            const laravelErrors = e.response.data?.errors ?? {}
            const mappedErrors: Record<string, string> = {}
            for (const key in laravelErrors) {
                mappedErrors[key] = laravelErrors[key]?.[0] ?? ''
            }
            formErrors.value = mappedErrors
        } else {
            formErrors.value = { general: e.response?.data?.message ?? 'A server error occurred. Please try again.' }
        }
    } finally {
        isSaving.value = false
    }
}
</script>

<template>
    <Teleport to="body">
        <Transition name="overlay">
            <div v-if="isOpen" class="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4" @click.self="handleClose">
                <div class="w-full max-w-lg bg-white rounded-card border border-neutral-300 p-6 max-h-[90vh] overflow-y-auto shadow-xl" role="dialog">

                    <h2 class="font-serif text-[22px] text-neutral-800 mb-1">{{ modalTitle }}</h2>
                    <p class="font-sans text-sm text-neutral-600 mb-6">Manage user details and system access.</p>

                    <div class="space-y-4">
                        <div v-if="formErrors.general" class="p-3 bg-red-50 text-[#8B1A1A] text-sm rounded border border-red-100">
                            {{ formErrors.general }}
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <TextInput v-model="formData.name" label="Full Name" :error="formErrors.name" required />
                            <TextInput v-model="formData.email" type="email" label="Email Address" :error="formErrors.email" required />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <TextInput
                                v-model="formData.password"
                                type="password"
                                :label="isEditing ? 'New Password (Optional)' : 'Temporary Password'"
                                :error="formErrors.password"
                                :required="!isEditing"
                            />
                            <TextInput
                                v-model="formData.expiry_date"
                                type="date"
                                label="Account Expiry Date"
                                :error="formErrors.expiry_date"
                                required
                            />
                        </div>

                        <SelectInput
                            v-model="formData.role"
                            label="System Role"
                            :options="roleOptions"
                            :error="formErrors.role"
                            required
                        />

                        <hr class="border-neutral-100 my-2" v-if="formData.role" />

                        <div v-if="['student', 'track_admin'].includes(formData.role)">
                            <SelectInput
                                v-model="formData.cohort_id"
                                label="Assign to Cohort"
                                :options="cohorts"
                                :error="formErrors.cohort_id"
                                required
                            />
                        </div>

                        <div v-if="formData.role === 'instructor'" class="space-y-4">
                            <SelectInput
                                v-model="formData.compensation_type"
                                label="Compensation Type"
                                :options="compensationOptions"
                                :error="formErrors.compensation_type"
                                required
                            />

                            <div v-if="formData.compensation_type === 'external'">
                                <TextInput v-model="formData.hourly_rate" type="number" label="Hourly Rate (EGP)" :error="formErrors.hourly_rate" required />
                            </div>
                            <div v-if="formData.compensation_type === 'internal'">
                                <TextInput v-model="formData.fixed_salary" type="number" label="Fixed Salary (EGP)" :error="formErrors.fixed_salary" required />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-8">
                        <button type="button" class="h-9.5 px-4 text-sm font-sans rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50" :disabled="isSaving" @click="handleClose">
                            Cancel
                        </button>
                        <button type="button" class="h-9.5 px-4 text-sm font-sans rounded-md bg-[#8B1A1A] text-white hover:bg-[#7a0002] disabled:opacity-50 flex items-center gap-2" :disabled="!isFormValid || isSaving" @click="handleSave">
                            <svg v-if="isSaving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            {{ submitLabel }}
                        </button>
                    </div>

                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }
</style>
