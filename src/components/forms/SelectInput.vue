<script setup lang="ts">
interface Option {
    label: string
    value: string | number
}

interface Props {
    modelValue:  string | number
    label:       string
    options:     Option[]
    placeholder?: string
    error?:      string
    required?:   boolean
    disabled?:   boolean
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Select an option',
    error:       '',
    required:    false,
    disabled:    false,
})

const emit = defineEmits<{
    'update:modelValue': [value: string | number]
}>()

function onChange(e: Event): void {
    emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">

    <label class="font-sans text-label text-neutral-500 tracking-widest uppercase">
      {{ props.label }}
      <span v-if="props.required" class="text-danger ml-0.5">*</span>
    </label>

    <div class="relative">
      <select
        :value="props.modelValue"
        :disabled="props.disabled"
        :required="props.required"
        class="w-full h-input rounded-input border font-sans text-base text-neutral-800 px-3 bg-white appearance-none transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        :class="props.error
          ? 'border-danger focus:border-danger'
          : 'border-neutral-300 focus:border-brand-red'"
        @change="onChange"
      >
        <option value="" disabled>{{ props.placeholder }}</option>
        <option
          v-for="opt in props.options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- chevron icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <p v-if="props.error" class="font-sans text-sm text-danger">
      {{ props.error }}
    </p>

  </div>
</template>