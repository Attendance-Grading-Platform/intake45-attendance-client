<script setup lang="ts">
interface Props {
    modelValue:  string
    label:       string
    type?:       'text' | 'email' | 'password' | 'number'
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

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

function onInput(e: Event): void {
    emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">

    <label class="font-sans text-label text-neutral-500 tracking-widest uppercase">
      {{ props.label }}
      <span v-if="props.required" class="text-danger ml-0.5">*</span>
    </label>

    <input
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :required="props.required"
      class="h-input rounded-input border font-sans text-base text-neutral-800 px-3 bg-white transition-colors placeholder:text-neutral-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      :class="props.error
        ? 'border-danger focus:border-danger'
        : 'border-neutral-300 focus:border-brand-red'"
      @input="onInput"
    />

    <p v-if="props.error" class="font-sans text-sm text-danger">
      {{ props.error }}
    </p>

  </div>
</template>