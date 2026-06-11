<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
// Assuming we might have an auth store register method, but we will mock it or just print to console for now
import { useAuthStore } from '@/stores/auth.store'
import libraryImage from '@/assets/images/auth-library.jpg'

// ── State ─────────────────────────────────────────────────
const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  fullName: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const errors = reactive({
  fullName: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const isFormValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return (
    form.fullName.trim().length >= 3 &&
    emailRegex.test(form.email) &&
    form.password.length >= 8 &&
    form.password === form.password_confirmation
  )
})

function validateField(field: keyof typeof errors) {
  errors[field] = ''
  
  if (field === 'fullName' && form.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters'
  }
  
  if (field === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      errors.email = 'Please enter a valid institutional email'
    }
  }
  
  if (field === 'password') {
    if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
  }
  
  if (field === 'password_confirmation') {
    if (form.password !== form.password_confirmation) {
      errors.password_confirmation = 'Passwords do not match'
    }
  }
}

// ── Submit ────────────────────────────────────────────────
const showPassword = ref<boolean>(false)
const showConfirmPassword = ref<boolean>(false)
const loading = ref<boolean>(false)
const errorType = ref<'validation' | 'unknown' | null>(null)

// ── Submit ────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  // Final validation sweep
  validateField('fullName')
  validateField('email')
  validateField('password')
  validateField('password_confirmation')

  if (!isFormValid.value || loading.value) return

  errorType.value = null
  loading.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    router.push('/login')
  } catch (err: unknown) {
    errorType.value = 'unknown'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">

    <!-- ── LEFT: Form Panel ──────────────────────────────── -->
    <div class="w-full md:w-[45%] flex items-center justify-center bg-brand-surface px-10 py-12">
      <div class="w-full max-w-[360px]">

        <!-- ITI Logo & Title -->
        <div class="text-center mb-8">
          <h1 class="text-5xl font-bold font-serif text-brand-red tracking-[0.3em]">
            ITI
          </h1>
          <div class="w-24 h-px bg-gray-300 mx-auto my-3" />
          <h2 class="text-xl font-bold text-neutral-800 mb-2">Create your account</h2>
          <p class="text-sm font-semibold text-neutral-600">Join the Industrial Training Institute portal</p>
        </div>

        <!-- ── Error: Password mismatch or unknown ── -->
        <Transition name="fade">
          <div
            v-if="errorType === 'unknown'"
            class="mb-5 p-4 rounded-lg bg-red-50 border border-red-300"
          >
            <p class="text-sm font-semibold text-red-700">Registration Failed</p>
            <p class="text-xs text-red-600">
              Something went wrong. Please try again later.
            </p>
          </div>
        </Transition>

        <!-- ── Form Fields ── -->
        <div class="space-y-4">

          <!-- Full Name -->
          <div>
            <label class="block text-[11px] font-bold text-neutral-800 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              v-model="form.fullName"
              type="text"
              placeholder="John Doe"
              autocomplete="name"
              :class="[
                'w-full px-3.5 py-2.5 text-sm bg-white border rounded-md',
                'outline-none transition duration-200 placeholder:text-gray-300',
                'focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red',
                errors.fullName ? 'border-red-500' : 'border-gray-200'
              ]"
              @blur="validateField('fullName')"
            />
            <p v-if="errors.fullName" class="text-[10px] text-red-600 mt-1 font-semibold">{{ errors.fullName }}</p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-[11px] font-bold text-neutral-800 uppercase tracking-widest mb-1.5">
              Institutional Email Address
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="j.doe@iti.edu"
              autocomplete="email"
              :class="[
                'w-full px-3.5 py-2.5 text-sm bg-white border rounded-md',
                'outline-none transition duration-200 placeholder:text-gray-300',
                'focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red',
                errors.email ? 'border-red-500' : 'border-gray-200'
              ]"
              @blur="validateField('email')"
            />
            <p v-if="errors.email" class="text-[10px] text-red-600 mt-1 font-semibold">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-[11px] font-bold text-neutral-800 uppercase tracking-widest mb-1.5">
              Password
            </label>

            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="new-password"
                :class="[
                  'w-full px-3.5 py-2.5 pr-11 text-sm bg-white border rounded-md',
                  'outline-none transition duration-200 placeholder:text-gray-300',
                  'focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red',
                  errors.password ? 'border-red-500' : 'border-gray-200'
                ]"
                @blur="validateField('password')"
              />

              <!-- Show / Hide Toggle -->
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                @click="showPassword = !showPassword"
              >
                <!-- Eye SVG ... -->
                <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="text-[10px] text-red-600 mt-1 font-semibold">{{ errors.password }}</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-[11px] font-bold text-neutral-800 uppercase tracking-widest mb-1.5">
              Confirm Password
            </label>

            <div class="relative">
              <input
                v-model="form.password_confirmation"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="new-password"
                :class="[
                  'w-full px-3.5 py-2.5 pr-11 text-sm bg-white border rounded-md',
                  'outline-none transition duration-200 placeholder:text-gray-300',
                  'focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red',
                  errors.password_confirmation ? 'border-red-500' : 'border-gray-200'
                ]"
                @blur="validateField('password_confirmation')"
                @keyup.enter="handleSubmit"
              />

              <!-- Show / Hide Toggle -->
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <!-- Eye SVG ... -->
                <svg v-if="showConfirmPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.password_confirmation" class="text-[10px] text-red-600 mt-1 font-semibold">{{ errors.password_confirmation }}</p>
          </div>

          <!-- Create Account Button -->
          <button
            type="button"
            
            class="w-full mt-2 py-3 text-sm font-bold text-white rounded-md transition-all duration-200
                   bg-brand-red hover:bg-brand-redHover active:bg-brand-redPress active:scale-[0.99]
                   "
            @click="handleSubmit"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <!-- Spinner -->
              <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating account...
            </span>
            <span v-else>Create account</span>
          </button>

          <!-- SignIn Link -->
          <div class="mt-6 text-center">
            <p class="text-xs font-semibold text-neutral-600">
              Already have an account?
              <router-link to="/login" class="font-bold text-brand-red hover:text-brand-redHover hover:underline transition-colors">
                Sign in
              </router-link>
            </p>
          </div>

        </div>

      </div>
      
      <!-- Footer Text -->
      <div class="absolute bottom-4 left-0 w-full md:w-[45%] text-center">
        <p class="text-[10px] text-gray-400 tracking-widest uppercase">© 2024 Industrial Training Institute</p>
      </div>
    </div>

    <!-- ── RIGHT: Image Panel ────────────────────────────── -->
    <div class="hidden md:block md:w-[55%] relative overflow-hidden bg-brand-surface">
      <img
        :src="libraryImage"
        alt="ITI Library"
        class="w-full h-full object-cover"
      />
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
