<script setup lang="ts">
import { ref } from "vue";
import { forgotPassword } from "@/api/modules/auth.api";
import TextInput from "@/components/forms/TextInput.vue";
import SubmitButton from "@/components/forms/SubmitButton.vue";

const email = ref("");
const isSubmitting = ref(false);
const isSuccess = ref(false);
const emailError = ref("");

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    emailError.value = "Email is required";
  } else if (!emailRegex.test(email.value)) {
    emailError.value = "Please enter a valid email address";
  } else {
    emailError.value = "";
  }
};

const handleForgot = async () => {
  validateEmail();
  if (emailError.value) return;

  isSubmitting.value = true;
  try {
    await forgotPassword(email.value);
  } catch (error) {
    // We ignore error to prevent email enumeration
    console.error("Forgot password error:", error);
  } finally {
    isSubmitting.value = false;
    isSuccess.value = true; // Always show success
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-brand-surface px-4">
    <div class="w-full max-w-[420px] bg-neutral-0 p-[40px] rounded-card border border-neutral-300 overflow-hidden">
      <div class="text-center mb-8">
        <h1 class="text-[32px] font-serif text-brand-red leading-none mb-4">ITI</h1>
        <hr class="border-t border-neutral-300 mb-4" />
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="!isSuccess" key="form">
          <h2 class="text-[18px] font-h3 text-neutral-800 mb-2">Forgot Password?</h2>
          <p class="text-base text-neutral-600 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form @submit.prevent="handleForgot" class="space-y-6">
            <TextInput 
              v-model="email" 
              type="email" 
              label="Email Address" 
              required 
              :error="emailError"
              @blur="validateEmail"
            />

            <SubmitButton
              label="Send Reset Link"
              :loading="isSubmitting"
              :disabled="!email || !!emailError"
              full-width
            />

            <div class="text-center pt-2">
              <router-link to="/login" class="text-sm font-sans text-neutral-600 hover:text-brand-red transition-colors">
                Back to login
              </router-link>
            </div>
          </form>
        </div>

        <div v-else key="success" class="text-center">
          <div class="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl">📧</span>
          </div>
          <h2 class="text-[18px] font-h3 text-neutral-800 mb-2">Check your email</h2>
          <p class="text-base text-neutral-600 mb-8">
            If an account exists for <span class="font-medium text-neutral-800">{{ email }}</span>, you will receive a password reset link shortly.
          </p>
          <router-link to="/login" class="text-sm font-sans text-brand-red font-medium hover:underline">
            Return to login
          </router-link>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
