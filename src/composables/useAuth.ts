// Thin wrapper around the auth store for composable-style usage in components
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

export function useAuth() {
    const authStore = useAuthStore()
    const user = computed(() => authStore.user)
    const role = computed(() => authStore.user?.role ?? null)
    const isLoggedIn = computed(() => authStore.isLoggedIn)

    return { user, role, isLoggedIn, authStore }
}
