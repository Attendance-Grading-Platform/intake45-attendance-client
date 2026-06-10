<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import AccountExpiredAlert from "@/components/auth/AccountExpiredAlert.vue";

// 1. ADDED THESE IMPORTS so Vue knows how to render the form fields
import TextInput from "@/components/forms/TextInput.vue";
import SubmitButton from "@/components/forms/SubmitButton.vue";

const authStore = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
// 2. ADDED THIS REF for the button loading state
const isSubmitting = ref(false);

// SEC-2: Your dedicated state variables
const isExpired = ref(false);
const generalError = ref("");

const handleLogin = async () => {
  isExpired.value = false;
  generalError.value = "";
  isSubmitting.value = true; // 3. Start loading spinner

  try {
    // Note: ensure your authStore expects an object if you are passing { email, password }
    await authStore.login({ email: email.value, password: password.value });
    const role = authStore.user?.role || "student";
    router.push(`/${role.replace("_", "-")}/dashboard`);
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message?.toLowerCase() || "";

    if (status === 403 && message.includes("expired")) {
      isExpired.value = true;
    } else {
      generalError.value = "Invalid email or password.";
    }
  } finally {
    isSubmitting.value = false; // 4. Stop loading spinner when done
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#F6E9C7] px-4">
    <div class="w-full max-w-[420px] bg-[#FFFFFF] p-[40px] rounded-[10px] border border-[#E0D4B8]">
      <div class="text-center mb-6">
        <h1 class="text-[36px] font-serif text-[#000000] leading-none mb-4">ITI</h1>
        <hr class="border-t border-[#E0D4B8] mb-4" />
        <h2 class="text-[16px] font-sans text-[#111111]">Sign in to your account</h2>
      </div>

      <AccountExpiredAlert v-if="isExpired" />

      <div
        v-else-if="generalError"
        class="mb-6 p-4 rounded-[6px] border border-[#92400E] bg-amber-50 text-[#92400E] font-sans text-[14px]"
      >
        {{ generalError }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <TextInput v-model="email" type="email" label="Email Address" required />

        <TextInput v-model="password" type="password" label="Password" required />

        <div class="pt-2">
          <SubmitButton
            :loading="isSubmitting"
            class="w-full h-[38px] rounded-[6px] bg-[#000000] text-[#FFFFFF] font-sans text-[14px] hover:bg-[#111111] transition-colors"
          >
            Sign in
          </SubmitButton>
        </div>
      </form>

      <div class="mt-8 text-center">
        <p class="text-[11px] font-sans text-[#888888] uppercase tracking-[1.5px]">
          Access is provisioned by your branch administrator.
        </p>
      </div>
    </div>
  </div>
</template>
