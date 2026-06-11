<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  password: string
}>()

const result = computed(() => {
  const p = props.password
  if (!p) return { score: 0, label: '', color: 'bg-neutral-200' }
  
  let score = 0
  if (p.length > 6) score++
  if (p.length > 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'bg-danger' }
  if (score <= 4) return { score, label: 'Medium', color: 'bg-warning' }
  return { score, label: 'Strong', color: 'bg-success' }
})
</script>

<template>
  <div class="mt-2">
    <div class="flex justify-between items-center mb-1">
      <span class="text-label text-neutral-500 uppercase">Strength</span>
      <span v-if="result.label" class="text-[12px] font-medium" :class="result.label === 'Weak' ? 'text-danger' : result.label === 'Medium' ? 'text-warning' : 'text-success'">
        {{ result.label }}
      </span>
    </div>
    <div class="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
      <div 
        class="h-full transition-all duration-300" 
        :class="result.color"
        :style="{ width: `${(Math.min(result.score, 5) / 5) * 100}%` }"
      ></div>
    </div>
  </div>
</template>
