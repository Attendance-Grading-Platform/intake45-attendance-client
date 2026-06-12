<template>
  <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Submit Assignment</h3>
        <p class="mt-0.5 text-sm text-gray-500">Upload a file or paste a repository link below.</p>
      </div>
      <!-- Live submission-mode badge -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <span
          v-if="submissionMode !== 'none'"
          :class="[
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
            submissionMode === 'both'
              ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
              : 'bg-green-50 text-green-700 ring-1 ring-green-200'
          ]"
        >
          <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
          {{ MODE_LABELS[submissionMode] }}
        </span>
      </Transition>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-5" novalidate>
      <!-- ── URL Input ────────────────────────────────────────────────── -->
      <div class="space-y-1.5">
        <label for="submission-url" class="block text-sm font-medium text-gray-700">
          Repository or Live URL
          <span class="ml-1 font-normal text-gray-400">(Optional)</span>
        </label>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3" aria-hidden="true">
            <svg class="size-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </span>
          <input
            id="submission-url"
            v-model="submissionUrl"
            type="url"
            placeholder="https://github.com/username/repo"
            :disabled="isSubmitting"
            :aria-invalid="urlValidationState === 'invalid'"
            :aria-describedby="urlValidationState === 'invalid' ? 'url-error' : undefined"
            :class="[
              'w-full pl-10 pr-9 py-2.5 rounded-md border text-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              urlValidationState === 'invalid'
                ? 'border-red-300 bg-red-50/60 text-red-900 placeholder:text-red-300'
                : 'border-gray-300 bg-white hover:border-gray-400'
            ]"
          />
          <span v-if="submissionUrl" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3" aria-hidden="true">
            <svg v-if="urlValidationState === 'valid'" class="size-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="size-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </span>
        </div>
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 -translate-y-0.5"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <p v-if="urlValidationState === 'invalid'" id="url-error" class="text-xs text-red-600">
            Please enter a valid URL starting with https://
          </p>
        </Transition>
      </div>

      <!-- ── OR Divider ───────────────────────────────────────────────── -->
      <div class="relative flex items-center" aria-hidden="true">
        <div class="flex-grow border-t border-gray-200" />
        <span class="mx-3 flex-shrink text-xs font-medium uppercase tracking-widest text-gray-400">or</span>
        <div class="flex-grow border-t border-gray-200" />
      </div>

      <!-- ── File Upload ──────────────────────────────────────────────── -->
      <FileUpload
        label="File Upload (Optional)"
        accept="application/pdf,image/jpeg,image/png"
        :maxSizeMb="10"
        :disabled="isSubmitting"
        @update:file="selectedFile = $event"
        @validation-error="errorMessage = $event"
      />

      <!-- ── Error Message ────────────────────────────────────────────── -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="errorMessage" role="alert" class="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <svg class="mt-0.5 size-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm text-red-700">{{ errorMessage }}</p>
        </div>
      </Transition>

      <!-- ── Footer ──────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between pt-1">
        <p :class="['text-xs', submissionMode === 'both' ? 'text-red-600 font-medium' : 'text-gray-400']">
          Please provide EITHER a URL OR a file, not both.
        </p>

        <SubmitButton
          :loading="isSubmitting"
          :disabled="!canSubmit"
          label="Submit Assignment"
          variant="primary"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FileUpload from '@/components/forms/FileUpload.vue';
import SubmitButton from '@/components/forms/SubmitButton.vue';

// ── Emits & Props ──────────────────────────────────────────────────────────────
const emit = defineEmits<{
  'submit-payload': [formData: FormData]
}>();

const props = defineProps<{
  isSubmitting?: boolean
}>();

// ── State ──────────────────────────────────────────────────────────────────────
const submissionUrl  = ref('');
const selectedFile   = ref<File | null>(null);
const errorMessage   = ref('');

// ── UI-only constants ──────────────────────────────────────────────────────────
const MODE_LABELS = {
  url:  'URL only',
  file: 'File only',
  both: 'URL + File (Invalid)',
} as const;

// ── Computed ───────────────────────────────────────────────────────────────────
/** 'empty' | 'valid' | 'invalid' */
const urlValidationState = computed(() => {
  if (!submissionUrl.value) return 'empty';
  try {
    const { protocol } = new URL(submissionUrl.value);
    return protocol === 'http:' || protocol === 'https:' ? 'valid' : 'invalid';
  } catch {
    return 'invalid';
  }
});

/** Gate for the submit button — also guards against an invalid URL slipping through */
const canSubmit = computed(() => {
  if (!submissionUrl.value && !selectedFile.value) return false;
  if (submissionUrl.value && selectedFile.value) return false; // Backend rejects both
  if (submissionUrl.value && urlValidationState.value === 'invalid') return false;
  return true;
});

/** Drives the live badge in the header */
const submissionMode = computed(() => {
  const hasUrl  = submissionUrl.value  && urlValidationState.value === 'valid';
  const hasFile = !!selectedFile.value;
  if (hasUrl && hasFile) return 'both';
  if (hasUrl)  return 'url';
  if (hasFile) return 'file';
  return 'none';
});

// ── Methods ────────────────────────────────────────────────────────────────────
const handleSubmit = () => {
  errorMessage.value = '';

  if (!submissionUrl.value && !selectedFile.value) {
    errorMessage.value = 'Please provide a URL or upload a file before submitting.';
    return;
  }

  if (submissionUrl.value && selectedFile.value) {
    errorMessage.value = 'You must provide EITHER a URL OR a file, not both.';
    return;
  }

  if (submissionUrl.value && urlValidationState.value === 'invalid') {
    errorMessage.value = 'Please enter a valid URL before submitting.';
    return;
  }

  const formData = new FormData();
  if (submissionUrl.value)  formData.append('url',  submissionUrl.value);
  if (selectedFile.value)   formData.append('file', selectedFile.value);

  emit('submit-payload', formData);
};
</script>
