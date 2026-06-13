<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type Plugin,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { ScoreProgression } from '@/api/modules/progress.api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
)

const thresholdPlugin: Plugin = {
  id: 'thresholdLine',
  afterDraw(chart) {
    const yAxis = chart.scales.y
    if (!yAxis) return

    const yPixel = yAxis.getPixelForValue(60)
    const ctx = chart.ctx

    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 1.5
    ctx.moveTo(chart.chartArea.left, yPixel)
    ctx.lineTo(chart.chartArea.right, yPixel)
    ctx.stroke()

    ctx.fillStyle = '#dc2626'
    ctx.font = '11px "DM Sans", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Pass Threshold (60)', chart.chartArea.left + 6, yPixel - 6)
    ctx.restore()
  },
}

ChartJS.register(thresholdPlugin)

interface Props {
  data?: ScoreProgression[]
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  height: '280px',
})

const chartData = computed<ChartData<'line'>>(() => {
  const points = props.data ?? []

  return {
    labels: points.map((entry) => {
      const [year, month] = entry.month.split('-')
      const date = new Date(Number(year), Number(month) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }),
    datasets: [
      {
        label: 'Average Score (%)',
        data: points.map((entry) => entry.average),
        borderColor: '#940002',
        backgroundColor: 'rgba(148, 0, 2, 0.08)',
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: '#940002',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        spanGaps: true,
      },
    ],
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  spanGaps: true,
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: { stepSize: 20, font: { family: 'DM Sans, sans-serif', size: 11 } },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: {
      ticks: { font: { family: 'DM Sans, sans-serif', size: 11 } },
      grid: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
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
    <Line :data="chartData" :options="chartOptions" />
  </div>
  <div v-else class="py-12 text-center">
    <p class="font-sans text-sm text-neutral-400">No grade data available yet.</p>
  </div>
</template>
