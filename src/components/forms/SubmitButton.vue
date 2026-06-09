<script setup lang="ts">
interface Props {
    label?:    string
    loading?:  boolean
    disabled?: boolean
    variant?:  'primary' | 'danger'
    fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    label:     'Submit',
    loading:   false,
    disabled:  false,
    variant:   'primary',
    fullWidth: false,
})
</script>

<template>
  <button
    type="submit"
    :disabled="props.loading || props.disabled"
    class="h-btn font-sans text-sm font-medium rounded-btn transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-5"
    :class="[
      props.variant === 'danger'
        ? 'bg-white border border-danger text-danger hover:bg-danger-light'
        : 'bg-brand-red text-brand-surface hover:opacity-90',
      props.fullWidth ? 'w-full' : '',
    ]"
  >
    <!-- spinner when loading -->
    <svg
      v-if="props.loading"
      class="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>

    {{ props.loading ? 'Please wait...' : props.label }}
  </button>
</template>