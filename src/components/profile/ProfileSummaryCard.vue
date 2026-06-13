<script setup lang="ts">
import ProfileAvatar from '@/components/profile/ProfileAvatar.vue'
import RoleBadge from '@/components/shared/RoleBadge.vue'
import type { UserProfile } from '@/types/profile.types'

defineProps<{
    profile: UserProfile
    isActive: boolean
    isExpired: boolean
}>()

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
</script>

<template>
    <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
        <div class="flex items-start gap-5">
            <ProfileAvatar :name="profile.name" />
            <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-3 mb-1">
                    <h2 class="font-serif text-[26px] text-[#1A0000]">{{ profile.name }}</h2>
                    <RoleBadge :role="profile.role" />
                </div>
                <p class="font-sans text-[14px] text-[#666666]">{{ profile.email }}</p>
            </div>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 pt-6 border-t border-[#C9BDB8]">
            <div>
                <dt class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Account status</dt>
                <dd class="font-sans text-[14px] font-medium" :class="isActive ? 'text-[#2D6A4F]' : 'text-[#991B1B]'">
                    {{ isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive' }}
                </dd>
            </div>
            <div>
                <dt class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Expiry date</dt>
                <dd class="font-sans text-[14px] text-[#1A0000] tabular-nums">{{ formatDate(profile.expiry_date) }}</dd>
            </div>
            <div v-if="profile.role === 'instructor'">
                <dt class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-1">Compensation</dt>
                <dd class="font-sans text-[14px] text-[#1A0000] capitalize">
                    {{ profile.compensation_type ?? '—' }}
                </dd>
            </div>
        </dl>
    </div>
</template>
