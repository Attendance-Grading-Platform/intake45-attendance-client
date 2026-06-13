<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { AttendanceTrend } from '@/api/modules/progress.api'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface Props {
  data?: AttendanceTrend[]
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  height: '240px',
})

const chartData = computed<ChartData<'bar'>>(() => {
  const points = props.data ?? []

  return {
    labels: points.map((entry) => entry.week),
    datasets: [
      {
        label: 'Present',
        data: points.map((entry) => entry.present),
        backgroundColor: '#059669',
        borderRadius: 4,
      },
      {
        label: 'Missed',
        data: points.map((entry) => entry.missed),
        backgroundColor: '#dc2626',
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: true,
      ticks: { font: { family: 'DM Sans, sans-serif', size: 10 } },
      grid: { display: false },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      ticks: { stepSize: 1, font: { family: 'DM Sans, sans-serif', size: 11 } },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 12,
        usePointStyle: true,
        pointStyleWidth: 10,
        font: { family: 'DM Sans, sans-serif', size: 11 },
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
  <div v-if="data?.length" :style="{ height }">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
  <div v-else class="py-12 text-center">
    <p class="font-sans text-sm text-neutral-400">No attendance records yet.</p>
  </div>
</template>
