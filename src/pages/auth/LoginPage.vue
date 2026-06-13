<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import TextInput from "@/components/forms/TextInput.vue";
import SubmitButton from "@/components/forms/SubmitButton.vue";

const authStore = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const isSubmitting = ref(false);

// Validation states
const emailError = ref("");
const passwordError = ref("");
const serverError = ref("");
const errorState = ref<'none' | 'invalid' | 'expired' | 'locked' | 'rate-limited' | 'connection'>('none');

const isFormValid = computed(() => {
  return email.value && password.value && !emailError.value && !passwordError.value;
});

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

const validatePassword = () => {
  if (!password.value) {
    passwordError.value = "Password is required";
  } else if (password.value.length < 6) {
    passwordError.value = "Password must be at least 6 characters";
  } else {
    passwordError.value = "";
  }
};

onMounted(() => {
  if (authStore.isLoggedIn) {
    const role = authStore.user?.role || "student";
    router.replace(`/${role.replace("_", "-")}/dashboard`);
  }
});

const handleLogin = async () => {
  validateEmail();
  validatePassword();
  if (!isFormValid.value) return;

  errorState.value = 'none';
  serverError.value = "";
  isSubmitting.value = true;

  try {
    await authStore.login({ email: email.value, password: password.value });
    const role = authStore.user?.role || "student";
    router.push(`/${role.replace("_", "-")}/dashboard`);
  } catch (error) {
    console.error("Login attempt failed:", error);
    const e = error as { response?: { status?: number; data?: { message?: string } } }
    const status = e.response?.status;
    const message = e.response?.data?.message?.toLowerCase() ?? "";

    if (status === 401) {
      errorState.value = 'invalid';
      serverError.value = "The email or password you entered is incorrect.";
    } else if (status === 403 && message.includes("expired")) {
      errorState.value = 'expired';
    } else if (status === 423) {
      errorState.value = 'locked';
      serverError.value = "Your account has been locked. Please contact support.";
    } else if (status === 429) {
      errorState.value = 'rate-limited';
      serverError.value = "Too many login attempts. Please try again in a few minutes.";
    } else if (!(error as any).response) {
      errorState.value = 'connection';
      serverError.value = "Unable to connect to the server. Please check your internet.";
    } else {
      errorState.value = 'none';
      serverError.value = "An unexpected error occurred. Please try again.";
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex bg-brand-surface">
    <!-- Left: Form Section -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-[420px] bg-neutral-0 p-[40px] rounded-card border border-neutral-300">
        <div class="text-center mb-8">
          <h1 class="text-[32px] font-serif text-brand-red leading-none mb-4">ITI</h1>
          <hr class="border-t border-neutral-300 mb-4" />
          <h2 class="text-[16px] font-sans text-neutral-600">Sign in to your account</h2>
        </div>

        <!-- 5 Error States -->
        <div v-if="errorState === 'expired'" class="mb-6 p-4 rounded-badge bg-danger-light border border-danger text-danger flex gap-3">
          <span class="text-lg">⏳</span>
          <div class="text-sm">
            <p class="font-medium">Account Expired</p>
            <p>Your access has expired. Please contact your branch administrator.</p>
          </div>
        </div>

        <div v-else-if="errorState === 'locked'" class="mb-6 p-4 rounded-badge bg-danger-light border border-danger text-danger flex gap-3">
          <span class="text-lg">🔒</span>
          <div class="text-sm">
            <p class="font-medium">Account Locked</p>
            <p>{{ serverError }}</p>
          </div>
        </div>

        <div v-else-if="errorState === 'rate-limited'" class="mb-6 p-4 rounded-badge bg-warning-light border border-warning text-warning flex gap-3">
          <span class="text-lg">🛑</span>
          <div class="text-sm">
            <p class="font-medium">Too Many Attempts</p>
            <p>{{ serverError }}</p>
          </div>
        </div>

        <div v-else-if="errorState === 'connection'" class="mb-6 p-4 rounded-badge bg-neutral-100 border border-neutral-300 text-neutral-600 flex gap-3">
          <span class="text-lg">🌐</span>
          <div class="text-sm">
            <p class="font-medium">Network Error</p>
            <p>{{ serverError }}</p>
          </div>
        </div>

        <div v-else-if="serverError" class="mb-6 p-4 rounded-badge bg-danger-light border border-danger text-danger flex gap-3">
          <span class="text-lg">⚠️</span>
          <div class="text-sm">
            <p class="font-medium">Sign-in Failed</p>
            <p>{{ serverError }}</p>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <TextInput 
            v-model="email" 
            type="email" 
            label="Email Address" 
            required 
            :error="emailError"
            @blur="validateEmail"
          />

          <div class="space-y-1">
            <TextInput 
              v-model="password" 
              type="password" 
              label="Password" 
              required 
              :error="passwordError"
              @blur="validatePassword"
            />
            <div class="flex justify-end">
              <router-link to="/forgot-password" class="text-[12px] font-sans text-neutral-500 hover:text-brand-red transition-colors">
                Forgot password?
              </router-link>
            </div>
          </div>

          <div class="pt-2">
            <SubmitButton
              label="Sign in"
              :loading="isSubmitting"
              :disabled="!isFormValid"
              full-width
            />
          </div>
        </form>

        <div class="mt-12 text-center">
          <p class="text-label text-neutral-500 uppercase tracking-widest">
            Access is provisioned by your branch administrator.
          </p>
        </div>
      </div>
    </div>

    <!-- Right: Image Section (Hidden on mobile) -->
    <div class="hidden lg:block lg:flex-1 relative">
      <img 
        src="/src/assets/images/auth-library.jpg" 
        alt="Library Background" 
        class="absolute inset-0 w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-brand-red/10 mix-blend-multiply"></div>
    </div>
  </div>
</template>
