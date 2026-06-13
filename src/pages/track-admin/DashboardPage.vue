<script setup lang="ts">
import { ref} from 'vue'

interface MetricCard {
  title: string
  value: string | number
  subtext: string
  isError?: boolean
}

interface GradeDistributionItem {
  range: string
  count: number
  percentage: number
  colorClass: string
}

interface AttendanceSquare {
  day: string
  status: 'full' | 'late' | 'absent'
}

interface GraderConsistencyItem {
  name: string
  score: number
  hasWarning?: boolean
  warningText?: string
}

const metrics = ref<MetricCard[]>([
  { title: 'Active Students', value: '42', subtext: '+2 from last month' },
  { title: 'Avg Attendance', value: '94.2%', subtext: 'Within target range' },
  { title: 'Lab Submission', value: '88%', subtext: '▼ 4% lower than avg', isError: true },
  { title: 'Cohort GPA', value: '3.41', subtext: 'Scale 0.0 - 4.0' }
])

const gradeDistribution = ref<GradeDistributionItem[]>([
  { range: '0-59', count: 6, percentage: 15, colorClass: 'bg-[#ba1a1a]' },
  { range: '60-74', count: 19, percentage: 45, colorClass: 'bg-[#665e47]' },
  { range: '75-100', count: 17, percentage: 40, colorClass: 'bg-[#940002]' }
])

const attendanceWeek = ref<AttendanceSquare[]>([
  { day: 'MON', status: 'full' }, { day: 'TUE', status: 'full' }, { day: 'WED', status: 'late' }, { day: 'THU', status: 'full' }, { day: 'FRI', status: 'full' },
  { day: 'MON', status: 'full' }, { day: 'TUE', status: 'absent' }, { day: 'WED', status: 'full' }, { day: 'THU', status: 'full' }, { day: 'FRI', status: 'late' },
  { day: 'MON', status: 'late' }, { day: 'TUE', status: 'full' }, { day: 'WED', status: 'full' }, { day: 'THU', status: 'full' }, { day: 'FRI', status: 'full' }
])

const graders = ref<GraderConsistencyItem[]>([
  { name: 'Lab Group 1', score: 82 },
  { name: 'Lab Group 2', score: 64, hasWarning: true, warningText: 'Score variance exceeds cohort threshold (12.4%)' },
  { name: 'Lab Group 3', score: 91 }
])

const hoveredCardIndex = ref<number | null>(null)

function getAttendanceClass(status: 'full' | 'late' | 'absent'): string {
  if (status === 'full') return 'bg-[#940002]'
  if (status === 'late') return 'bg-[#ebdfc2]'
  return 'bg-[#1b1b1b] opacity-20'
}

function triggerReportDownload() {
}
</script>

<template>
  <div class="min-h-screen bg-[#E6DDD4] text-[#1b1b1b] font-sans selection:bg-[#940002] selection:text-white pb-16 md:pb-6">
    <div class="max-w-7xl mx-auto px-6 py-10">

      <header class="mb-10">
        <span class="font-sans text-[11px] font-bold text-[#4c4546] uppercase tracking-[1.5px] mb-2 block">
          Web Development · Intake 45
        </span>
        <h2 class="font-serif text-[36px] text-[#1b1b1b] leading-tight font-medium mb-4">
          Cohort overview
        </h2>
        <div class="h-px bg-[#C9BDB8] w-full"></div>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div
          v-for="(metric, idx) in metrics"
          :key="metric.title"
          class="bg-white border rounded-[10px] p-6 transition-all duration-200"
          :style="{ borderColor: hoveredCardIndex === idx ? '#940002' : '#C9BDB8' }"
          @mouseenter="hoveredCardIndex = idx"
          @mouseleave="hoveredCardIndex = null"
        >
          <p class="font-sans text-[11px] font-bold text-[#4c4546] uppercase tracking-[1.5px] mb-2">
            {{ metric.title }}
          </p>
          <p class="text-[32px] font-bold font-mono tabular-nums text-[#940002] leading-none">
            {{ metric.value }}
          </p>
          <p
            class="text-xs mt-3"
            :class="metric.isError ? 'text-[#ba1a1a]' : 'text-[#4c4546]'"
          >
            {{ metric.subtext }}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <section class="bg-white border border-[#C9BDB8] rounded-[10px] p-6 flex flex-col justify-between">
          <div>
            <h3 class="font-sans text-[18px] font-bold text-[#1b1b1b] mb-6">Grade distribution</h3>
            <div class="space-y-4">
              <div v-for="item in gradeDistribution" :key="item.range" class="flex items-center gap-4">
                <span class="w-12 text-[10px] font-bold text-[#4c4546] uppercase tracking-[0.5px]">
                  {{ item.range }}
                </span>
                <div class="grow bg-[#eeeeee] h-8 overflow-hidden rounded-sm relative">
                  <div class="absolute top-0 left-0 h-full transition-all duration-500" :class="item.colorClass" :style="{ width: item.percentage + '%' }"></div>
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold font-mono tabular-nums text-[#1b1b1b]">
                    {{ item.count }} students
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-[#4c4546] mt-8">
            Cumulative grades updated as of yesterday at 11:59 PM.
          </p>
        </section>

        <section class="bg-white border border-[#C9BDB8] rounded-[10px] p-6">
          <div class="flex justify-between items-start mb-6">
            <h3 class="font-sans text-[18px] font-bold text-[#1b1b1b]">Attendance this week</h3>
            <div class="flex gap-3">
              <span class="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.5px]">
                <span class="w-3 h-3 rounded-xs bg-[#940002]"></span> Full
              </span>
              <span class="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.5px]">
                <span class="w-3 h-3 rounded-xs bg-[#ebdfc2]"></span> Late
              </span>
            </div>
          </div>

          <div class="grid grid-cols-5 gap-3 mb-6">
            <div class="text-center font-bold text-[9px] text-[#4c4546] tracking-[0.5px]">MON</div>
            <div class="text-center font-bold text-[9px] text-[#4c4546] tracking-[0.5px]">TUE</div>
            <div class="text-center font-bold text-[9px] text-[#4c4546] tracking-[0.5px]">WED</div>
            <div class="text-center font-bold text-[9px] text-[#4c4546] tracking-[0.5px]">THU</div>
            <div class="text-center font-bold text-[9px] text-[#4c4546] tracking-[0.5px]">FRI</div>

            <div
              v-for="(cell, index) in attendanceWeek"
              :key="index"
              class="w-full h-12 rounded-sm transition-opacity duration-200 hover:opacity-90"
              :class="getAttendanceClass(cell.status)"
            ></div>
          </div>

          <div class="border-t border-[#C9BDB8] pt-4">
            <p class="text-[11px] font-bold text-[#4c4546] uppercase tracking-[1px]">Key Anomalies</p>
            <p class="text-xs text-[#1b1b1b] mt-1.5">Lab Group 2 missed Wednesday lecture session.</p>
          </div>
        </section>

        <section class="bg-white border border-[#C9BDB8] rounded-[10px] p-6 flex flex-col justify-between">
          <div class="space-y-6">
            <h3 class="font-sans text-[18px] font-bold text-[#1b1b1b] mb-2">Grader consistency</h3>
            <div v-for="group in graders" :key="group.name" class="space-y-2">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold uppercase tracking-[0.5px] text-[#1b1b1b]">{{ group.name }}</span>
                  <svg v-if="group.hasWarning" class="w-4 h-4 text-[#ba1a1a]" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <span class="text-xs font-bold font-mono tabular-nums" :class="group.hasWarning ? 'text-[#ba1a1a]' : 'text-[#940002]'">
                  {{ group.score }}/100
                </span>
              </div>
              <div class="w-full bg-[#eeeeee] h-2 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="group.hasWarning ? 'bg-[#ba1a1a]' : 'bg-[#940002]'"
                  :style="{ width: group.score + '%' }"
                ></div>
              </div>
              <p v-if="group.hasWarning" class="text-[10px] text-[#ba1a1a] italic mt-1">
                {{ group.warningText }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="triggerReportDownload"
            class="w-full mt-8 border border-[#940002] text-[#940002] font-bold text-[10px] uppercase tracking-[1px] py-3 hover:bg-[#940002] hover:text-white transition-all duration-200 rounded-md"
          >
            Download Full Auditor Report
          </button>
        </section>

      </div>

      <footer class="mt-10 flex justify-between items-center border-t border-[#C9BDB8] pt-4">
        <p class="text-[10px] text-[#4c4546] font-bold uppercase tracking-[1px]">System Status: Synchronized</p>
        <p class="text-[10px] text-[#4c4546] font-bold uppercase tracking-[1px]">ITI Management Console v4.2.0</p>
      </footer>

    </div>
  </div>
</template>
