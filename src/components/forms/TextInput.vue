<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
    modelValue:  string
    label:       string
    type?:       'text' | 'email' | 'password' | 'number' | 'date'
    placeholder?: string
    error?:      string
    required?:   boolean
    disabled?:   boolean
}

const props = withDefaults(defineProps<Props>(), {
    type:        'text',
    placeholder: '',
    error:       '',
    required:    false,
    disabled:    false,
})

const showPassword = ref(false)

const inputType = computed(() => {
    if (props.type === 'password') {
        return showPassword.value ? 'text' : 'password'
    }
    return props.type
})

const emit = defineEmits<{
    'update:modelValue': [value: string]
    'blur': [event: FocusEvent]
}>()

function onInput(e: Event): void {
    emit('update:modelValue', (e.target as HTMLInputElement).value)
}

function onBlur(e: FocusEvent): void {
    emit('blur', e)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">

    <label class="font-sans text-label text-neutral-500 tracking-widest uppercase">
      {{ props.label }}
      <span v-if="props.required" class="text-danger ml-0.5">*</span>
    </label>

    <div class="relative flex items-center">
      <input
        :type="inputType"
        :value="props.modelValue"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :required="props.required"
        class="h-input w-full rounded-input border font-sans text-base text-neutral-800 px-3 bg-white transition-colors placeholder:text-neutral-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        :class="props.error
          ? 'border-danger focus:border-danger'
          : 'border-neutral-300 focus:border-brand-red'"
        @input="onInput"
        @blur="onBlur"
      />

      <button
        v-if="props.type === 'password'"
        type="button"
        class="absolute right-3 p-1 text-neutral-400 hover:text-neutral-600 focus:outline-none"
        @click="showPassword = !showPassword"
      >
        <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.88 9.88L4.62 4.62M1 1l22 22M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M9.91 9.91a2.96 2.96 0 0 0 4.17 4.17" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>

    <p v-if="props.error" class="font-sans text-sm text-danger mt-1">
      {{ props.error }}
    </p>

  </div>
</template>