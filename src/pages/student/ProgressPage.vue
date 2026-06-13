<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  type Plugin,
} from 'chart.js'
import {
  getStudentProgress,
  type StudentProgressPayload,
} from '@/api/modules/progress.api'

// ── Chart.js Registration ────────────────────────
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
)

// ── Threshold Line Plugin (dashed at 60%) ────────
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

    // Label
    ctx.fillStyle = '#dc2626'
    ctx.font = '11px "DM Sans", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Pass Threshold (60)', chart.chartArea.left + 6, yPixel - 6)
    ctx.restore()
  },
}

ChartJS.register(thresholdPlugin)

// ── Reactive State ───────────────────────────────
const isLoading = ref(true)
const error     = ref<string | null>(null)
const progress  = ref<StudentProgressPayload | null>(null)

// ── Fetch ────────────────────────────────────────
onMounted(async () => {
  try {
    const res = await getStudentProgress()
    progress.value = res.data.data
  } catch (err: any) {
    error.value =
      err.response?.data?.message || 'Failed to load progress data.'
  } finally {
    isLoading.value = false
  }
})

/* ═══════════════════════════════════════════════════
 |  Section 1 — Academic Score Progression (Line)
 ═══════════════════════════════════════════════════*/

const scoreChartData = computed(() => {
  const d = progress.value?.score_progression ?? []
  return {
    labels: d.map((s) => {
      const [y, m] = s.month.split('-')
      const date = new Date(Number(y), Number(m) - 1)
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }),
    datasets: [
      {
        label: 'Average Score (%)',
        data: d.map((s) => s.average),
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

const scoreChartOptions = {
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
      bodyFont:  { family: 'DM Sans, sans-serif', size: 12 },
      padding: 10,
      cornerRadius: 6,
    },
  },
}

/* ═══════════════════════════════════════════════════
 |  Section 2a — Attendance Trend (Stacked Bar)
 ═══════════════════════════════════════════════════*/

const attendanceChartData = computed(() => {
  const d = progress.value?.attendance_trend ?? []
  return {
    labels: d.map((w) => w.week),
    datasets: [
      {
        label: 'Present',
        data: d.map((w) => w.present),
        backgroundColor: '#059669',
        borderRadius: 4,
      },
      {
        label: 'Missed',
        data: d.map((w) => w.missed),
        backgroundColor: '#dc2626',
        borderRadius: 4,
      },
    ],
  }
})

const attendanceChartOptions = {
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
      position: 'bottom' as const,
      labels: { padding: 12, usePointStyle: true, pointStyleWidth: 10, font: { family: 'DM Sans, sans-serif', size: 11 } },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { family: 'DM Sans, sans-serif', size: 13 },
      bodyFont:  { family: 'DM Sans, sans-serif', size: 12 },
      padding: 10,
      cornerRadius: 6,
    },
  },
}

/* ═══════════════════════════════════════════════════
 |  Section 2b — Ledger History (Stepped Line)
 ═══════════════════════════════════════════════════*/

const ledgerChartData = computed(() => {
  const d = progress.value?.ledger_history ?? []
  return {
    labels: d.map((l) => {
      const date = new Date(l.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Ledger Balance',
        data: d.map((l) => l.balance),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.06)',
        fill: true,
        stepped: 'before' as const,
        pointRadius: 3,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  }
})

const ledgerChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      max: 260,
      ticks: { stepSize: 50, font: { family: 'DM Sans, sans-serif', size: 11 } },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: {
      ticks: { font: { family: 'DM Sans, sans-serif', size: 10 }, maxRotation: 45 },
      grid: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { family: 'DM Sans, sans-serif', size: 13 },
      bodyFont:  { family: 'DM Sans, sans-serif', size: 12 },
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        afterBody: (items: any[]) => {
          const idx = items[0]?.dataIndex
          const d = progress.value?.ledger_history?.[idx]
          return d ? `\n${d.description}` : ''
        },
      },
    },
  },
}

/* ═══════════════════════════════════════════════════
 |  Helpers
 ═══════════════════════════════════════════════════*/

const barColor = (pct: number) => {
  if (pct >= 85) return 'bg-emerald-600'
  if (pct >= 70) return 'bg-blue-600'
  if (pct >= 60) return 'bg-amber-500'
  return 'bg-red-600'
}

const barTextColor = (pct: number) => {
  if (pct >= 85) return 'text-emerald-700'
  if (pct >= 70) return 'text-blue-700'
  if (pct >= 60) return 'text-amber-700'
  return 'text-red-700'
}

const statusPill = (status: string) => {
  switch (status) {
    case 'present': return 'bg-emerald-100 text-emerald-800'
    case 'late':    return 'bg-amber-100 text-amber-800'
    case 'absent':  return 'bg-red-100 text-red-800'
    default:        return 'bg-neutral-100 text-neutral-600'
  }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
}

const formatType = (type: string) => {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const finalIndexColor = computed(() => {
  const idx = progress.value?.final_index ?? 0
  if (idx >= 85) return 'text-emerald-700'
  if (idx >= 70) return 'text-blue-700'
  if (idx >= 60) return 'text-amber-700'
  return 'text-red-700'
})
</script>

<template>
  <div class="p-6 min-h-[calc(100vh-56px)]">

    <!-- ─── Page Header ─────────────────────────── -->
    <div class="mb-8">
      <h3 class="font-sans text-label uppercase tracking-widest text-neutral-500 mb-1">
        Student Portal
      </h3>
      <h1 class="font-serif text-h1 text-neutral-900">My Progress</h1>
    </div>

    <!-- ─── Loading Skeleton ────────────────────── -->
    <div v-if="isLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        v-for="i in 5"
        :key="i"
        :class="[
          'rounded-card border border-neutral-300 bg-neutral-0 p-6 animate-pulse',
          i === 1 ? 'lg:col-span-2 min-h-[280px]' : 'min-h-[220px]'
        ]"
      >
        <div class="h-4 bg-neutral-200 rounded w-1/3 mb-4" />
        <div class="h-8 bg-neutral-200 rounded w-1/2 mb-3" />
        <div class="h-4 bg-neutral-200 rounded w-2/3" />
      </div>
    </div>

    <!-- ─── Error State ─────────────────────────── -->
    <div
      v-else-if="error"
      class="rounded-card border border-danger bg-danger-light p-8 text-center max-w-lg mx-auto"
    >
      <svg class="mx-auto mb-4 h-10 w-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <p class="font-sans text-base text-danger font-medium mb-2">Something went wrong</p>
      <p class="font-sans text-sm text-neutral-600">{{ error }}</p>
    </div>

    <!-- ─── Bento Grid ──────────────────────────── -->
    <div v-else class="space-y-6">

      <!-- ═══════════════════════════════════════════
           Section 1 — Academic Score Progression (full-width)
           ═══════════════════════════════════════════ -->
      <div
        id="widget-score-progression"
        class="rounded-card border border-neutral-300 bg-neutral-0 p-6"
      >
        <div class="flex items-center gap-3 mb-5">
          <div class="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
            <svg class="h-5 w-5 text-[#940002]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          </div>
          <div>
            <h3 class="font-sans text-h3 text-neutral-900">Academic Score Progression</h3>
            <p class="font-sans text-sm text-neutral-500">Monthly average grade trend</p>
          </div>
        </div>

        <div v-if="progress?.score_progression?.length" class="h-[280px]">
          <Line :data="scoreChartData" :options="scoreChartOptions" />
        </div>
        <div v-else class="py-12 text-center">
          <p class="font-sans text-sm text-neutral-400">No grade data available yet.</p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           Section 2 — Attendance & Ledger (2-column)
           ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- 2a: Attendance Trend (Stacked Bar) -->
        <div
          id="widget-attendance-trend"
          class="rounded-card border border-neutral-300 bg-neutral-0 p-6"
        >
          <div class="flex items-center gap-3 mb-5">
            <div class="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h3 class="font-sans text-h3 text-neutral-900">Attendance Trend</h3>
              <p class="font-sans text-sm text-neutral-500">Last 4 weeks</p>
            </div>
          </div>

          <div v-if="progress?.attendance_trend?.length" class="h-[240px]">
            <Bar :data="attendanceChartData" :options="attendanceChartOptions" />
          </div>
          <div v-else class="py-12 text-center">
            <p class="font-sans text-sm text-neutral-400">No attendance records yet.</p>
          </div>
        </div>

        <!-- 2b: Ledger History (Stepped Line) -->
        <div
          id="widget-ledger-history"
          class="rounded-card border border-neutral-300 bg-neutral-0 p-6"
        >
          <div class="flex items-center gap-3 mb-5">
            <div class="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
              <svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h3 class="font-sans text-h3 text-neutral-900">Attendance Ledger</h3>
              <p class="font-sans text-sm text-neutral-500">Balance over time (from 250)</p>
            </div>
          </div>

          <div v-if="progress?.ledger_history?.length" class="h-[240px]">
            <Line :data="ledgerChartData" :options="ledgerChartOptions" />
          </div>
          <div v-else class="py-12 text-center">
            <p class="font-sans text-sm text-neutral-400">No ledger data available.</p>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           Section 3 — Course Breakdown (progress bars)
           ═══════════════════════════════════════════ -->
      <div
        id="widget-course-breakdown"
        class="rounded-card border border-neutral-300 bg-neutral-0 p-6"
      >
        <div class="flex items-center gap-3 mb-5">
          <div class="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
            <svg class="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h3 class="font-sans text-h3 text-neutral-900">Course Breakdown</h3>
            <p class="font-sans text-sm text-neutral-500">Current standing per course</p>
          </div>
        </div>

        <div v-if="progress?.course_breakdown?.length" class="space-y-4">
          <div
            v-for="(course, idx) in progress.course_breakdown"
            :key="idx"
            class="group"
          >
            <div class="flex justify-between items-baseline mb-1.5">
              <span class="font-sans text-sm font-medium text-neutral-800">{{ course.course_name }}</span>
              <span class="font-sans text-sm font-bold" :class="barTextColor(course.percentage)">
                {{ course.percentage }}%
              </span>
            </div>
            <div class="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000 ease-out"
                :class="barColor(course.percentage)"
                :style="{ width: `${Math.min(course.percentage, 100)}%` }"
              />
            </div>
          </div>
        </div>
        <div v-else class="py-8 text-center">
          <p class="font-sans text-sm text-neutral-400">No courses graded yet.</p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           Section 4 — Session Record (data table)
           ═══════════════════════════════════════════ -->
      <div
        id="widget-session-record"
        class="rounded-card border border-neutral-300 bg-neutral-0 p-6"
      >
        <div class="flex items-center gap-3 mb-5">
          <div class="h-10 w-10 rounded-full bg-cyan-50 flex items-center justify-center">
            <svg class="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <div>
            <h3 class="font-sans text-h3 text-neutral-900">Recent Sessions</h3>
            <p class="font-sans text-sm text-neutral-500">Latest 10 attendance records</p>
          </div>
        </div>

        <div v-if="progress?.session_record?.length" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-neutral-300">
                <th class="py-3 px-4 font-sans text-label uppercase tracking-wider text-neutral-500">Date</th>
                <th class="py-3 px-4 font-sans text-label uppercase tracking-wider text-neutral-500">Type</th>
                <th class="py-3 px-4 font-sans text-label uppercase tracking-wider text-neutral-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(rec, idx) in progress.session_record"
                :key="idx"
                class="border-b border-neutral-200 last:border-b-0 hover:bg-neutral-50 transition-colors duration-fast"
              >
                <td class="py-3.5 px-4 font-sans text-sm text-neutral-800">{{ formatDate(rec.date) }}</td>
                <td class="py-3.5 px-4 font-sans text-sm text-neutral-600">{{ formatType(rec.type) }}</td>
                <td class="py-3.5 px-4 text-right">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                    :class="statusPill(rec.status)"
                  >
                    {{ rec.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="py-8 text-center">
          <p class="font-sans text-sm text-neutral-400">No session records yet.</p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           Footer — Final Index (massive score)
           ═══════════════════════════════════════════ -->
      <div
        id="widget-final-index"
        class="rounded-card border border-neutral-300 bg-neutral-0 p-8 text-center"
      >
        <p class="font-sans text-label uppercase tracking-widest text-neutral-500 mb-4">
          Cumulative Performance Index
        </p>
        <div class="mb-4">
          <span
            class="font-serif text-[72px] leading-none tracking-tight drop-shadow-sm"
            :class="finalIndexColor"
          >
            {{ progress?.final_index?.toFixed(1) ?? '0.0' }}
          </span>
          <span class="font-serif text-[28px] text-neutral-400 ml-1">/ 100</span>
        </div>
        <div class="flex items-center justify-center gap-2 text-sm text-neutral-500">
          <div class="w-2 h-2 rounded-full" :class="finalIndexColor.replace('text-', 'bg-')" />
          <span>
            {{
              (progress?.final_index ?? 0) >= 85 ? 'Excellent Standing'
              : (progress?.final_index ?? 0) >= 70 ? 'Very Good Standing'
              : (progress?.final_index ?? 0) >= 60 ? 'Good Standing'
              : 'Needs Improvement'
            }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>
