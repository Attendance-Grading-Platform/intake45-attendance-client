<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  type ChartData,
  type ChartOptions
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

interface Props {
  data: ChartData<'doughnut'>
  totalAmount: string
}

const props = defineProps<Props>()

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: true
    }
  }
}

// Custom plugin to draw text in the center
const plugins = [
  {
    id: 'centerText',
    beforeDraw(chart: { ctx: CanvasRenderingContext2D; width: number; height: number }) {
      const { ctx, width, height } = chart
      ctx.restore()
      
      // Draw "Total"
      const fontSize1 = (height / 150).toFixed(2)
      ctx.font = `${fontSize1}em "DM Sans"`
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#666666'
      
      const text1 = 'Total'
      const textX1 = Math.round((width - ctx.measureText(text1).width) / 2)
      const textY1 = height / 2 - 15
      
      ctx.fillText(text1, textX1, textY1)

      // Draw Amount
      const fontSize2 = (height / 120).toFixed(2)
      ctx.font = `600 ${fontSize2}em "DM Sans"`
      ctx.fillStyle = '#1A0000'
      
      const text2 = props.totalAmount
      const textX2 = Math.round((width - ctx.measureText(text2).width) / 2)
      const textY2 = height / 2 + 15
      
      ctx.fillText(text2, textX2, textY2)
      
      ctx.save()
    }
  }
]
</script>

<template>
  <div class="h-[250px] w-full relative">
    <Doughnut :data="props.data" :options="options" :plugins="plugins" />
  </div>
</template>
