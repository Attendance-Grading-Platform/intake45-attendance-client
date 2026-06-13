import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { billingApi } from '@/api/modules/billing.api'
import * as cohortApi from '@/api/modules/cohort.api'
import type { BillingRollup, CohortOption } from '@/types/billing.types'

interface BillingSnapshot {
    id: number
    compensation_type: string
    delivered_hours: string | number
    created_at: string
    cohort?: { name?: string }
    person_id: number
    person?: { name?: string; hourly_rate?: string | number }
    hourly_component?: string | number
    fixed_salary_component?: string | number
    total_amount?: string | number
}

interface BillingApiData {
    snapshots?: BillingSnapshot[]
    summary?: {
        grand_total_amount?: number
        cost_per_student?: string | number
        students_count?: string | number
    }
}

export const useBillingStore = defineStore('billing', () => {
    const cohorts = ref<CohortOption[]>([])
    const selectedCohort = ref<number | null>(null)
    const rollup = ref<BillingRollup | null>(null)
    const loadingCohorts = ref(false)
    const loadingRollup = ref(false)
    const generating = ref(false)
    const error = ref<string | null>(null)

    const fetchCohorts = async () => {
        loadingCohorts.value = true
        error.value = null
        try {
            const response = await cohortApi.listCohorts()
            cohorts.value = response.data.data as unknown as CohortOption[]
            if (!selectedCohort.value && cohorts.value.length > 0) {
                const active = cohorts.value.find(c => c.status === 'active')
                selectedCohort.value = active ? active.id : (cohorts.value[0]?.id ?? null)
            }
        } catch (e) {
            error.value = 'Failed to load cohorts'
            console.error(e)
        } finally {
            loadingCohorts.value = false
        }
    }

    const fetchRollup = async (cohortId: number) => {
        loadingRollup.value = true
        error.value = null
        rollup.value = null
        try {
            const response = await billingApi.getRollup(cohortId)
            const data = response.data.data as BillingApiData
            if (data.snapshots && data.snapshots.length > 0) {
                rollup.value = {
                    id: data.snapshots[0]!.id,
                    cohort_id: cohortId,
                    cohort_name: data.snapshots[0]!.cohort?.name ?? 'Cohort',
                    generated_at: data.snapshots[0]!.created_at,
                    total_cost: data.summary?.grand_total_amount ?? 0,
                    total_internal_hours: data.snapshots.filter(s => s.compensation_type === 'internal').reduce((sum, s) => sum + parseFloat(String(s.delivered_hours)), 0),
                    total_external_hours: data.snapshots.filter(s => s.compensation_type === 'external').reduce((sum, s) => sum + parseFloat(String(s.delivered_hours)), 0),
                    cost_per_student: parseFloat(String(data.summary?.cost_per_student ?? 0)),
                    students_count: parseInt(String(data.summary?.students_count ?? 0)),
                    entries: data.snapshots.map(s => ({
                        id: s.id,
                        user_id: s.person_id,
                        name: s.person?.name ?? 'Unknown',
                        compensation_type: s.compensation_type as 'internal' | 'external',
                        delivered_hours: parseFloat(String(s.delivered_hours ?? 0)),
                        hourly_rate: parseFloat(String(s.person?.hourly_rate ?? 0)),
                        fixed_salary: parseFloat(String(s.fixed_salary_component ?? 0)),
                        hourly_component: parseFloat(String(s.hourly_component ?? 0)),
                        total_amount: parseFloat(String(s.total_amount ?? 0)),
                    }))
                }
            }
        } catch (e) {
            const err = e as { response?: { status?: number } }
            if (err.response?.status !== 404) {
                error.value = 'Failed to load billing rollup'
                console.error(e)
            }
        } finally {
            loadingRollup.value = false
        }
    }

    const generateRollup = async (cohortId: number) => {
        generating.value = true
        error.value = null
        try {
            await billingApi.generateRollup(cohortId)
            await fetchRollup(cohortId)
        } catch (e) {
            error.value = 'Failed to generate billing rollup'
            console.error(e)
        } finally {
            generating.value = false
        }
    }

    const internalEntries = computed(() => rollup.value?.entries?.filter(e => e.compensation_type === 'internal') || [])
    const externalEntries = computed(() => rollup.value?.entries?.filter(e => e.compensation_type === 'external') || [])
    const internalTotal = computed(() => internalEntries.value.reduce((sum, e) => sum + e.total_amount, 0))
    const externalTotal = computed(() => externalEntries.value.reduce((sum, e) => sum + e.total_amount, 0))

    return {
        cohorts, selectedCohort, rollup, loadingCohorts, loadingRollup, generating, error,
        fetchCohorts, fetchRollup, generateRollup,
        internalEntries, externalEntries, internalTotal, externalTotal
    }
})
