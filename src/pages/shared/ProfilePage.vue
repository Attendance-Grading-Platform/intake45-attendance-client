<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRole } from '@/composables/useRole'
import { useProfile } from '@/composables/useProfile'
import PageHeader from '@/components/shared/PageHeader.vue'
import AccountExpiredAlert from '@/components/auth/AccountExpiredAlert.vue'
import ProfileSummaryCard from '@/components/profile/ProfileSummaryCard.vue'
import ProfileRoleContext from '@/components/profile/ProfileRoleContext.vue'
import ProfileAccountForm from '@/components/profile/ProfileAccountForm.vue'
import { ROLES } from '@/constants/roles'

const { role } = useRole()
const {
    profile,
    context,
    isLoading,
    isSaving,
    error,
    saveMessage,
    isExpired,
    isAccountActive,
    fetchProfile,
    saveProfile,
} = useProfile()

const pageLabel = computed(() =>
    role.value === ROLES.BRANCH_MANAGER ? 'Administration' : 'My account',
)

onMounted(() => fetchProfile())
</script>

<template>
    <div class="max-w-3xl mx-auto pb-10">
        <PageHeader :label="pageLabel" title="Profile" />

        <AccountExpiredAlert v-if="isExpired" />

        <div v-if="isLoading" class="font-sans text-[14px] text-[#888888] py-12 text-center">
            Loading profile…
        </div>

        <div v-else-if="error && !profile" class="p-4 rounded-[6px] border border-[#991B1B] bg-[#FEE2E2] text-[#991B1B] font-sans text-[14px]">
            {{ error }}
        </div>

        <template v-else-if="profile">
            <div
                v-if="error"
                class="mb-6 p-4 rounded-[6px] border border-[#991B1B] bg-[#FEE2E2] text-[#991B1B] font-sans text-[14px]"
            >
                {{ error }}
            </div>

            <div
                v-if="saveMessage"
                class="mb-6 p-4 rounded-[6px] border border-[#2D6A4F] bg-[#D1FAE5] text-[#2D6A4F] font-sans text-[14px]"
            >
                {{ saveMessage }}
            </div>

            <div class="space-y-6">
                <ProfileSummaryCard
                    :profile="profile"
                    :is-active="isAccountActive"
                    :is-expired="isExpired"
                />
                <ProfileRoleContext :profile="profile" :context="context" />
                <ProfileAccountForm
                    :profile="profile"
                    :saving="isSaving"
                    @save="saveProfile"
                />
            </div>
        </template>
    </div>
</template>
