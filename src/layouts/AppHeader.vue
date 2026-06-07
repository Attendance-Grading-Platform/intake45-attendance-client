<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { ROLES } from "@/constants/roles";

const props = withDefaults(defineProps<{ sidebarOpen?: boolean }>(), { sidebarOpen: true });
const emit = defineEmits<{ "toggle-sidebar": [] }>();

const auth = useAuthStore();
const router = useRouter();

// role
const roleLabel = computed((): string => {
  const map: Record<string, string> = {
    [ROLES.BRANCH_MANAGER]: "Branch Manager",
    [ROLES.TRACK_ADMIN]: "Track Admin",
    [ROLES.INSTRUCTOR]: "Instructor",
    [ROLES.STUDENT]: "Student",
  };
  return auth.role ? (map[auth.role] ?? "") : "";
});

// avatar
const userInitials = computed((): string =>
  auth.user?.name
    ? auth.user.name
        .split(" ")
        .slice(0, 2)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "?",
);

const userMenuOpen = ref<boolean>(false);
const notificationCount = ref<number>(3);

function toggleUserMenu(): void {
  userMenuOpen.value = !userMenuOpen.value;
}
function closeUserMenu(): void {
  userMenuOpen.value = false;
}

async function handleLogout(): Promise<void> {
  auth.logout();
  await router.push({ name: "login" });
}
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-topbar h-topbar bg-brand-red flex items-center px-4 gap-4 border-b border-[#7a0002]"
  >
    <div class="flex items-center gap-3">
      <!-- Hamburger -->
      <button
        type="button"
        aria-label="Toggle sidebar"
        class="w-8 h-8 flex flex-col justify-center items-center gap-[5px] rounded-btn text-brand-surface hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-surface/60"
        @click="emit('toggle-sidebar')"
      >
        <span
          class="block w-[18px] h-px bg-brand-surface rounded-full transition-all duration-200"
          :class="props.sidebarOpen ? 'translate-y-[6px] rotate-45' : ''"
        />
        <span
          class="block w-[18px] h-px bg-brand-surface rounded-full transition-all duration-200"
          :class="props.sidebarOpen ? 'opacity-0' : ''"
        />
        <span
          class="block w-[18px] h-px bg-brand-surface rounded-full transition-all duration-200"
          :class="props.sidebarOpen ? '-translate-y-[6px] -rotate-45' : ''"
        />
      </button>

      <span class="font-serif text-[20px] text-brand-surface select-none">ITI</span>
      <span class="hidden sm:block w-px h-5 bg-white/20" />
      <span class="hidden sm:block font-sans text-sm text-brand-surface/70">Academic Portal</span>
    </div>

    <div class="flex-1" />

    <div class="flex items-center gap-3">
      <!-- Role-->
      <span
        v-if="roleLabel"
        class="hidden md:inline-flex items-center px-3 h-[26px] rounded-full border border-brand-surface/30 font-sans text-label text-brand-surface/80 tracking-widest uppercase select-none"
      >
        {{ roleLabel }}
      </span>

      <button
        type="button"
        aria-label="Notifications"
        class="relative w-9 h-9 flex items-center justify-center rounded-btn text-brand-surface hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-surface/60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-[18px] h-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span
          v-if="notificationCount > 0"
          class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-white font-sans text-[10px] font-medium text-brand-red select-none"
        >
          {{ notificationCount > 9 ? "9+" : notificationCount }}
        </span>
      </button>

      <div class="relative">
        <button
          type="button"
          :aria-expanded="userMenuOpen"
          aria-haspopup="true"
          class="flex items-center gap-2 rounded-btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-surface/60"
          @click="toggleUserMenu"
        >
          <span
            class="w-8 h-8 rounded-full bg-white/15 border border-white/30 flex items-center justify-center font-sans text-xs font-medium text-brand-surface select-none hover:bg-white/25 transition-colors"
          >
            {{ userInitials }}
          </span>
          <span class="hidden lg:block font-sans text-sm text-brand-surface/85">{{
            auth.user?.name
          }}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="hidden lg:block w-3.5 h-3.5 text-brand-surface/60 transition-transform duration-200"
            :class="userMenuOpen ? 'rotate-180' : ''"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0 translate-y-1 scale-95"
        >
          <div
            v-if="userMenuOpen"
            v-click-outside="closeUserMenu"
            role="menu"
            class="absolute right-0 top-[calc(100%+8px)] w-52 py-1 bg-white rounded-card border border-neutral-300 shadow-modal z-modal"
          >
            <div class="px-4 py-3 border-b border-neutral-300">
              <p class="font-sans text-sm font-medium text-neutral-800 truncate">
                {{ auth.user?.name }}
              </p>
              <p class="font-sans text-xs text-neutral-500 truncate mt-0.5">
                {{ auth.user?.email }}
              </p>
            </div>

            <div class="py-1">
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-4 py-2 font-sans text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Profile settings
              </button>
              <hr class="my-1 border-neutral-300" />
              <button
                type="button"
                role="menuitem"
                class="w-full text-left px-4 py-2 font-sans text-sm text-danger hover:bg-danger-light transition-colors"
                @click="handleLogout"
              >
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>

  <div class="h-topbar flex-shrink-0" aria-hidden="true" />
</template>
