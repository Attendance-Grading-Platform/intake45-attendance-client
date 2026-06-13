<script setup lang="ts">
import { computed } from 'vue'

interface Bucket {
  label: string
  count: number
}

interface Props {
  buckets: Bucket[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { loading: false })

const maxCount = computed(() =>
  props.buckets.length === 0 ? 1 : Math.max(...props.buckets.map(b => b.count), 1)
)

function barWidth(count: number): string {
  return Math.round((count / maxCount.value) * 100) + '%'
}

function barColor(label: string): string {
  const score = parseInt(label)
  if (isNaN(score)) return 'bg-neutral-300'
  if (score >= 90) return 'bg-neutral-800'
  if (score >= 75) return 'bg-neutral-600'
  if (score >= 60) return 'bg-neutral-400'
  return 'bg-danger'
}
</script>

<template>
  <div class="bg-white rounded-card border border-neutral-300 overflow-hidden">
    <div class="px-6 py-4 border-b border-neutral-300 bg-neutral-50">
      <p class="font-sans text-[11px] text-neutral-500 uppercase tracking-[1.5px] mb-0.5">Analytics</p>
      <h3 class="font-sans text-h3 font-medium text-neutral-800">Grade Distribution</h3>
    </div>

    <div class="px-6 py-5">

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3">
          <div class="w-14 h-2.75 bg-neutral-200 rounded animate-pulse" />
          <div class="flex-1 h-7 bg-neutral-100 rounded animate-pulse" />
          <div class="w-6 h-2.75 bg-neutral-200 rounded animate-pulse" />
        </div>
      </div>

      <div v-else-if="buckets.length === 0" class="py-10 text-center font-sans text-sm text-neutral-500">
        No grade data available for this cohort.
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="bucket in buckets"
          :key="bucket.label"
          class="flex items-center gap-3"
        >
          <span class="w-14 text-right font-sans text-[11px] text-neutral-500 uppercase tracking-wider shrink-0">
            {{ bucket.label }}
          </span>
          <div class="flex-1 h-7 bg-neutral-100 rounded-input overflow-hidden">
            <div
              class="h-full rounded-input transition-all duration-slow"
              :class="barColor(bucket.label)"
              :style="{ width: barWidth(bucket.count) }"
            />
          </div>
          <span class="w-6 font-mono text-[12px] text-neutral-600 tabular-nums shrink-0">
            {{ bucket.count }}
          </span>
        </div>
      </div>

      <div v-if="!loading && buckets.length > 0" class="mt-4 pt-4 border-t border-neutral-300 flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-neutral-800" />
          <span class="font-sans text-[11px] text-neutral-500">90–100</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-neutral-600" />
          <span class="font-sans text-[11px] text-neutral-500">75–89</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-neutral-400" />
          <span class="font-sans text-[11px] text-neutral-500">60–74</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-full bg-danger" />
          <span class="font-sans text-[11px] text-neutral-500">Below 60</span>
        </div>
      </div>

    </div>
  </div>
</template>
