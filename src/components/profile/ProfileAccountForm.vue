<script setup lang="ts">
import { ref, watch } from 'vue'
import TextInput from '@/components/forms/TextInput.vue'
import SubmitButton from '@/components/forms/SubmitButton.vue'
import type { UserProfile } from '@/types/profile.types'

const props = defineProps<{
    profile: UserProfile
    saving?: boolean
}>()

const emit = defineEmits<{
    save: [payload: { name: string; email: string; password?: string }]
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const formErrors = ref<Record<string, string>>({})

watch(
    () => props.profile,
    (p) => {
        name.value = p.name
        email.value = p.email
        password.value = ''
        confirmPassword.value = ''
        formErrors.value = {}
    },
    { immediate: true },
)

function validate(): boolean {
    formErrors.value = {}

    if (!name.value.trim()) formErrors.value.name = 'Name is required.'
    if (!email.value.trim()) formErrors.value.email = 'Email is required.'

    if (password.value) {
        if (password.value.length < 8) {
            formErrors.value.password = 'Password must be at least 8 characters.'
        }
        if (password.value !== confirmPassword.value) {
            formErrors.value.confirmPassword = 'Passwords do not match.'
        }
    }

    return Object.keys(formErrors.value).length === 0
}

function onSubmit(): void {
    if (!validate()) return

    emit('save', {
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value || undefined,
    })
}
</script>

<template>
    <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
        <h3 class="font-serif text-[26px] text-[#1A0000] mb-1">Account settings</h3>
        <p class="font-sans text-[14px] text-[#666666] mb-6">
            Update your name, email, or password. Role and expiry are managed by your administrator.
        </p>

        <form class="space-y-4 max-w-xl" @submit.prevent="onSubmit">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                    v-model="name"
                    label="Full name"
                    :error="formErrors.name"
                    required
                />
                <TextInput
                    v-model="email"
                    type="email"
                    label="Email address"
                    :error="formErrors.email"
                    required
                />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                    v-model="password"
                    type="password"
                    label="New password"
                    placeholder="Leave blank to keep current"
                    :error="formErrors.password"
                />
                <TextInput
                    v-model="confirmPassword"
                    type="password"
                    label="Confirm password"
                    placeholder="Repeat new password"
                    :error="formErrors.confirmPassword"
                />
            </div>

            <div class="pt-2">
                <SubmitButton
                    label="Save changes"
                    :loading="saving"
                    :disabled="saving"
                />
            </div>
        </form>
    </div>
</template>
