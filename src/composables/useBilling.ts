import { ref, computed } from 'vue'
import { billingApi } from '@/api/modules/billing.api'
import * as cohortApi from '@/api/modules/cohort.api'
import type { BillingRollup, BillingEntry, CohortOption } from '@/types/billing.types'

export function useBilling() {
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
            // Map to simplified CohortOption shape
            cohorts.value = response.data.data as any

            // Auto-select first active cohort
            if (!selectedCohort.value && cohorts.value.length > 0) {
                const active = cohorts.value.find(c => c.status === 'active')
                if (active) {
                    selectedCohort.value = active.id
                } else if (cohorts.value[0]) {
                    selectedCohort.value = cohorts.value[0].id
                }
            }
        } catch (e: any) {
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
            const data = response.data.data as any

            if (data.snapshots && data.snapshots.length > 0) {
                // Transform backend structure to frontend interface
                rollup.value = {
                    id: data.snapshots[0].id,
                    cohort_id: cohortId,
                    cohort_name: data.snapshots[0].cohort?.name || 'Cohort',
                    generated_at: data.snapshots[0].created_at,
                    total_cost: data.summary.grand_total_amount,
                    total_internal_hours: data.snapshots
                        .filter((s: any) => s.compensation_type === 'internal')
                        .reduce((sum: number, s: any) => sum + parseFloat(s.delivered_hours), 0),
                    total_external_hours: data.snapshots
                        .filter((s: any) => s.compensation_type === 'external')
                        .reduce((sum: number, s: any) => sum + parseFloat(s.delivered_hours), 0),
                    cost_per_student: parseFloat(data.summary.cost_per_student || 0),
                    students_count: parseInt(data.summary.students_count || 0),
                    entries: data.snapshots.map((s: any) => {
                        const deliveredHours = parseFloat(s.delivered_hours || 0);
                        const hourlyRate = parseFloat(s.person?.hourly_rate || 0);
                        const hourlyComponent = parseFloat(s.hourly_component || 0);
                        const fixedSalary = parseFloat(s.fixed_salary_component || 0);
                        const totalAmount = parseFloat(s.total_amount || 0);

                        return {
                            id: s.id,
                            user_id: s.person_id,
                            name: s.person?.name || 'Unknown',
                            compensation_type: s.compensation_type,
                            delivered_hours: deliveredHours,
                            hourly_rate: hourlyRate,
                            fixed_salary: fixedSalary,
                            hourly_component: hourlyComponent,
                            total_amount: totalAmount
                        };
                    })
                } as BillingRollup
            }
        } catch (e: any) {
            if (e.response?.status !== 404) {
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
            // After generation, fetch the actual data
            await fetchRollup(cohortId)
        } catch (e: any) {
            error.value = 'Failed to generate billing rollup'
            console.error(e)
        } finally {
            generating.value = false
        }
    }

    const internalEntries = computed(() =>
        rollup.value?.entries?.filter(e => e.compensation_type === 'internal') || []
    )

    const externalEntries = computed(() =>
        rollup.value?.entries?.filter(e => e.compensation_type === 'external') || []
    )

    const internalTotal = computed(() =>
        internalEntries.value.reduce((sum, e) => sum + e.total_amount, 0)
    )

    const externalTotal = computed(() =>
        externalEntries.value.reduce((sum, e) => sum + e.total_amount, 0)
    )

    const chartData = computed(() => ({
        labels: ['Internal', 'External'],
        datasets: [{
            data: [internalTotal.value, externalTotal.value],
            backgroundColor: ['#8B1A1A', '#3B82F6'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    }))

    return {
        cohorts,
        selectedCohort,
        rollup,
        loadingCohorts,
        loadingRollup,
        generating,
        error,
        fetchCohorts,
        fetchRollup,
        generateRollup,
        internalEntries,
        externalEntries,
        internalTotal,
        externalTotal,
        chartData
    }
}
