<script setup lang="ts">
defineProps<{
    open: boolean
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    loading?: boolean
    hideCancel?: boolean
    danger?: boolean
}>()

const emit = defineEmits<{
    confirm: []
    cancel: []
}>()
</script>

<template>
    <Teleport to="body">
        <Transition name="overlay">
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                @click.self="emit('cancel')"
            >
                <div
                    class="w-full max-w-md bg-white rounded-[10px] border border-neutral-300 p-6"
                    role="dialog"
                    aria-modal="true"
                >
                    <h3 class="text-[18px] font-sans font-medium text-neutral-800 mb-3">
                        {{ title ?? 'Confirm Action' }}
                    </h3>

                    <p class="text-sm font-sans text-neutral-600 mb-6 leading-relaxed">
                        {{ message }}
                    </p>

                    <div class="flex justify-end gap-3">
                        <button
                            v-if="!hideCancel"
                            type="button"
                            class="h-[38px] px-4 text-sm font-sans rounded-[6px] border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
                            :disabled="loading"
                            @click="emit('cancel')"
                        >
                            {{ cancelLabel ?? 'Cancel' }}
                        </button>

                        <button
                            type="button"
                            class="h-[38px] px-4 text-sm font-sans rounded-[6px] transition-colors disabled:opacity-60 flex items-center gap-2"
                            :class="danger
                                ? 'border border-danger text-danger hover:bg-danger-light'
                                : 'bg-brand-red text-brand-surface hover:bg-[#7a0002]'"
                            :disabled="loading"
                            @click="emit('confirm')"
                        >
                            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            {{ confirmLabel ?? 'Confirm' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
    transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
    opacity: 0;
}
</style>
