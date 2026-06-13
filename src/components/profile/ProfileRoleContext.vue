<script setup lang="ts">
import { computed } from 'vue'
import type { ProfileContext, UserProfile } from '@/types/profile.types'
import { ROLES } from '@/constants/roles'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
    profile: UserProfile
    context: ProfileContext
}>()

const sectionTitle = computed(() => {
    switch (props.profile.role) {
        case ROLES.STUDENT: return 'Cohort & lab group'
        case ROLES.INSTRUCTOR: return 'Teaching assignments'
        case ROLES.TRACK_ADMIN: return 'Assigned cohorts'
        case ROLES.BRANCH_MANAGER: return 'Administration scope'
        default: return 'Role context'
    }
})

const sectionDescription = computed(() => {
    switch (props.profile.role) {
        case ROLES.BRANCH_MANAGER:
            return 'You have full visibility across tracks, cohorts, accounts, and billing for this branch.'
        case ROLES.TRACK_ADMIN:
            return 'Cohorts you are assigned to administer.'
        case ROLES.INSTRUCTOR:
            return 'Cohorts and lab groups linked to your teaching schedule.'
        case ROLES.STUDENT:
            return 'Your current enrollment and lab group placement.'
        default:
            return ''
    }
})
</script>

<template>
    <div class="bg-white rounded-[10px] border border-[#C9BDB8] p-6">
        <h3 class="font-serif text-[26px] text-[#1A0000] mb-1">{{ sectionTitle }}</h3>
        <p class="font-sans text-[14px] text-[#666666] mb-6">{{ sectionDescription }}</p>

        <!-- Branch manager -->
        <p
            v-if="profile.role === ROLES.BRANCH_MANAGER"
            class="font-sans text-[14px] text-[#1A0000]"
        >
            Platform-wide administrator — manage user accounts from the
            <router-link to="/branch-manager/accounts" class="text-[#940002] hover:underline">
                Accounts
            </router-link>
            page.
        </p>

        <!-- Track admin / student cohorts -->
        <ul
            v-else-if="context.cohorts.length"
            class="divide-y divide-[#C9BDB8]"
        >
            <li
                v-for="cohort in context.cohorts"
                :key="cohort.id"
                class="py-4 first:pt-0 last:pb-0 flex flex-wrap items-baseline justify-between gap-2"
            >
                <div>
                    <p class="font-sans text-[14px] font-medium text-[#1A0000]">{{ cohort.name }}</p>
                    <p v-if="cohort.track" class="font-sans text-[13px] text-[#666666] mt-0.5">
                        {{ cohort.track.name }}
                    </p>
                </div>
                <span
                    v-if="cohort.status"
                    class="font-sans text-[11px] tracking-[1.5px] uppercase px-2 py-0.5 rounded-[6px] border"
                    :class="cohort.status === 'active'
                        ? 'border-[#2D6A4F] text-[#2D6A4F]'
                        : 'border-[#888888] text-[#888888]'"
                >
                    {{ cohort.status }}
                </span>
            </li>
        </ul>
        <p v-else class="font-sans text-[14px] text-[#888888]">
            No cohort assignment found.
        </p>

        <!-- Lab groups (student / instructor) -->
        <div v-if="context.labGroups.length" class="mt-6 pt-6 border-t border-[#C9BDB8]">
            <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-3">
                {{ profile.role === ROLES.STUDENT ? 'Lab group' : 'Lab groups' }}
            </p>
            <ul class="space-y-3">
                <li
                    v-for="group in context.labGroups"
                    :key="group.id"
                    class="flex flex-wrap items-baseline justify-between gap-2"
                >
                    <div>
                        <p class="font-sans text-[14px] font-medium text-[#1A0000]">{{ group.name }}</p>
                        <p class="font-sans text-[13px] text-[#666666]">{{ group.cohortName }}</p>
                    </div>
                    <span
                        v-if="profile.role === ROLES.INSTRUCTOR"
                        class="font-sans text-[13px] text-[#666666] tabular-nums"
                    >
                        {{ group.studentCount }} students
                    </span>
                </li>
            </ul>
        </div>

        <!-- Instructor compensation detail -->
        <div
            v-if="profile.role === ROLES.INSTRUCTOR && profile.compensation_type"
            class="mt-6 pt-6 border-t border-[#C9BDB8]"
        >
            <p class="font-sans text-[11px] text-[#888888] tracking-[1.5px] uppercase mb-2">Compensation detail</p>
            <p class="font-sans text-[14px] text-[#1A0000] tabular-nums">
                <template v-if="profile.compensation_type === 'external' && profile.hourly_rate != null">
                    {{ formatCurrency(profile.hourly_rate) }} / hour
                </template>
                <template v-else-if="profile.compensation_type === 'internal' && profile.fixed_salary != null">
                    {{ formatCurrency(profile.fixed_salary) }} / month
                </template>
                <template v-else>—</template>
            </p>
        </div>
    </div>
</template>
