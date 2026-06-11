<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { resetPassword } from "@/api/modules/auth.api";
import TextInput from "@/components/forms/TextInput.vue";
import SubmitButton from "@/components/forms/SubmitButton.vue";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator.vue";

const route = useRoute();
const router = useRouter();

const token = ref("");
const email = ref("");
const password = ref("");
const password_confirmation = ref("");
const isSubmitting = ref(false);
const isSuccess = ref(false);
const countdown = ref(3);
const statusError = ref("");

const passwordError = ref("");
const confirmError = ref("");

const validatePassword = () => {
  if (!password.value) {
    passwordError.value = "Password is required";
  } else if (password.value.length < 8) {
    passwordError.value = "Password must be at least 8 characters";
  } else {
    passwordError.value = "";
  }
};

const validateConfirm = () => {
  if (password_confirmation.value !== password.value) {
    confirmError.value = "Passwords do not match";
  } else {
    confirmError.value = "";
  }
};

const isFormValid = computed(() => {
  return password.value && password_confirmation.value && !passwordError.value && !confirmError.value;
});

onMounted(() => {
  token.value = (route.query.token as string) || "";
  email.value = (route.query.email as string) || "";

  if (!token.value || !email.value) {
    statusError.value = "Invalid or missing reset token.";
  }
});

const startCountdown = () => {
  const interval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(interval);
      router.push("/login");
    }
  }, 1000);
};

const handleReset = async () => {
  validatePassword();
  validateConfirm();
  if (!isFormValid.value) return;

  isSubmitting.value = true;
  statusError.value = "";

  try {
    await resetPassword({
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    });
    isSuccess.value = true;
    startCountdown();
  } catch (error: any) {
    const message = error.response?.data?.message?.toLowerCase() || "";
    if (message.includes("expired") || message.includes("invalid")) {
      statusError.value = "Your reset link has expired or is invalid. Please request a new one.";
    } else {
      statusError.value = "An error occurred while resetting your password. Please try again.";
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-brand-surface px-4">
    <div class="w-full max-w-[420px] bg-neutral-0 p-[40px] rounded-card border border-neutral-300">
      <div class="text-center mb-8">
        <h1 class="text-[32px] font-serif text-brand-red leading-none mb-4">ITI</h1>
        <hr class="border-t border-neutral-300 mb-4" />
      </div>

      <div v-if="isSuccess" class="text-center">
        <div class="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="text-2xl">✅</span>
        </div>
        <h2 class="text-[18px] font-h3 text-neutral-800 mb-2">Password Reset Successful</h2>
        <p class="text-base text-neutral-600 mb-8">
          Your password has been updated. Redirecting to login in {{ countdown }} seconds...
        </p>
        <router-link to="/login" class="text-sm font-sans text-brand-red font-medium hover:underline">
          Go to login now
        </router-link>
      </div>

      <div v-else>
        <h2 class="text-[18px] font-h3 text-neutral-800 mb-2">Reset Password</h2>
        <p class="text-base text-neutral-600 mb-6">
          Please enter your new password below.
        </p>

        <div v-if="statusError" class="mb-6 p-4 rounded-badge bg-danger-light border border-danger text-danger">
          <p class="text-sm">{{ statusError }}</p>
          <div v-if="statusError.includes('expired')" class="mt-2">
            <router-link to="/forgot-password" class="text-xs font-bold underline">Request new link</router-link>
          </div>
        </div>

        <form @submit.prevent="handleReset" class="space-y-6">
          <div>
            <TextInput 
              v-model="password" 
              type="password" 
              label="New Password" 
              required 
              :error="passwordError"
              @blur="validatePassword"
            />
            <PasswordStrengthIndicator :password="password" />
          </div>

          <TextInput 
            v-model="password_confirmation" 
            type="password" 
            label="Confirm New Password" 
            required 
            :error="confirmError"
            @blur="validateConfirm"
          />

          <SubmitButton
            label="Reset Password"
            :loading="isSubmitting"
            :disabled="!isFormValid || !!statusError"
            full-width
          />
        </form>
      </div>
    </div>
  </div>
</template>
