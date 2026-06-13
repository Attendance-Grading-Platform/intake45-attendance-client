<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { GradeDistribution } from '@/api/modules/dashboard.api'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  distribution?: GradeDistribution | Record<string, number> | null
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  distribution: null,
  height: '220px',
})

const chartData = computed<ChartData<'doughnut'> | null>(() => {
  if (!props.distribution) return null

  const labels = Object.keys(props.distribution)
  const values = Object.values(props.distribution)

  if (labels.length === 0) return null

  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#059669',
          '#0891b2',
          '#2563eb',
          '#d97706',
          '#dc2626',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }
})

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 16,
        usePointStyle: true,
        pointStyleWidth: 10,
        font: { family: 'DM Sans, sans-serif', size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { family: 'DM Sans, sans-serif', size: 13 },
      bodyFont: { family: 'DM Sans, sans-serif', size: 12 },
      padding: 10,
      cornerRadius: 6,
    },
  },
}
</script>

<template>
  <div v-if="chartData" class="flex items-center justify-center" :style="{ minHeight: height, height }">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
  <div v-else class="flex items-center justify-center" :style="{ minHeight: height }">
    <p class="font-sans text-sm text-neutral-400">No grade data available.</p>
  </div>
</template>
