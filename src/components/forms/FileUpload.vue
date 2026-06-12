<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
    label:       string
    accept?:     string   // "image/*,.pdf"
    maxSizeMb?:  number   // default 1 MB
    error?:      string
    required?:   boolean
    disabled?:   boolean
}

const props = withDefaults(defineProps<Props>(), {
    accept:     'image/*,.pdf',
    maxSizeMb:  1,
    error:      '',
    required:   false,
    disabled:   false,
})

const emit = defineEmits<{
    'update:file': [file: File | null]
    'update:path': [path: string]
    'validation-error': [message: string]
}>()

const inputRef      = ref<HTMLInputElement | null>(null)
const isDragging    = ref<boolean>(false)
const selectedFile  = ref<File | null>(null)
const localError    = ref<string>('')

function validateFile(file: File): string | null {
    // Basic dynamic MIME validation based on accept prop
    if (props.accept) {
        const allowed = props.accept.split(',').map(s => s.trim());
        const isMatch = allowed.some(type => {
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.replace('/*', '/'));
            }
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            return file.type === type;
        });
        if (!isMatch) {
            return `Invalid file type. Allowed: ${props.accept}`;
        }
    }
    const maxBytes = props.maxSizeMb * 1024 * 1024
    if (file.size > maxBytes) {
        return `File must be under ${props.maxSizeMb} MB`
    }
    return null
}

function processFile(file: File): void {
    const error = validateFile(file)

    if (error) {
        localError.value = error
        emit('validation-error', error)
        emit('update:file', null)
        emit('update:path', '')
        selectedFile.value = null
        return
    }

    localError.value  = ''
    selectedFile.value = file
    emit('update:file', file)
    emit('update:path', file.name)
}

function onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) processFile(file)
}

function onDrop(e: DragEvent): void {
    isDragging.value = false
    const file = e.dataTransfer?.files?.[0]
    if (file) processFile(file)
}

function clearFile(): void {
    selectedFile.value = null
    localError.value   = ''
    emit('update:file', null)
    emit('update:path', '')
    if (inputRef.value) inputRef.value.value = ''
}

const displayError = computed(() => props.error || localError.value)
</script>

<template>
  <div class="flex flex-col gap-1.5">

    <label class="font-sans text-label text-neutral-500 tracking-widest uppercase">
      {{ props.label }}
      <span v-if="props.required" class="text-danger ml-0.5">*</span>
    </label>

    <!-- drop zone -->
    <div
      class="relative border rounded-input transition-colors cursor-pointer"
      :class="[
        isDragging   ? 'border-brand-red bg-neutral-100' : 'border-dashed border-neutral-300 bg-white',
        displayError ? 'border-danger' : '',
        props.disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="!props.disabled && inputRef?.click()"
    >
      <input
        ref="inputRef"
        type="file"
        :accept="props.accept"
        :required="props.required"
        :disabled="props.disabled"
        class="hidden"
        @change="onFileChange"
      />

      <!-- no file selected -->
      <div v-if="!selectedFile" class="py-6 flex flex-col items-center gap-1 text-center px-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-neutral-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p class="font-sans text-sm text-neutral-500">
          Drop file here or <span class="text-brand-red">browse</span>
        </p>
        <p class="font-sans text-label text-neutral-400 tracking-widest uppercase">
          PDF or image · max {{ props.maxSizeMb }} MB
        </p>
      </div>

      <!-- file selected -->
      <div v-else class="py-3 px-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-sans text-sm text-neutral-700 truncate max-w-[200px]">
            {{ selectedFile.name }}
          </span>
          <span class="font-sans text-label text-neutral-400 tracking-widest uppercase">
            {{ (selectedFile.size / 1024).toFixed(0) }} KB
          </span>
        </div>

        <!-- clear button -->
        <button
          type="button"
          class="font-sans text-sm text-danger hover:opacity-70 transition-opacity ml-2"
          @click.stop="clearFile"
        >
          Remove
        </button>
      </div>
    </div>

    <!-- error message -->
    <p v-if="displayError" class="font-sans text-sm text-danger">
      {{ displayError }}
    </p>

  </div>
</template>