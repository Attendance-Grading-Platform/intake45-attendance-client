<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
import { ROLE_NAVIGATION } from "@/constants/navigation";

const props = defineProps<{ open: boolean }>();
const auth = useAuthStore();
const route = useRoute();

const navItems = computed(() => {
  if (!auth.role) return [];
  return ROLE_NAVIGATION[auth.role] || [];
});

const isActive = (name: string): boolean => route.name === name;
</script>

<template>
  <aside
    class="fixed left-0 top-topbar h-[calc(100vh-56px)] z-sidebar w-sidebar bg-white border-r border-neutral-300 flex flex-col transition-transform duration-200"
    :class="props.open ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Main navigation"
  >
    <nav class="flex-1 overflow-y-auto py-3">
      <ul role="list" class="space-y-0.5 px-2">
        <li v-for="item in navItems" :key="item.name">
          <RouterLink
            :to="{ name: item.name }"
            :aria-current="isActive(item.name) ? 'page' : undefined"
            class="group flex items-center gap-3 px-3 py-2.5 pl-[10px] border-l-2 rounded-btn font-sans text-base transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red"
            :class="
              isActive(item.name)
                ? 'text-brand-red bg-neutral-100 border-brand-red'
                : 'text-neutral-600 border-transparent hover:text-neutral-800 hover:bg-neutral-50'
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-[18px] h-[18px] flex-shrink-0 transition-colors"
              :class="
                isActive(item.name)
                  ? 'text-brand-red'
                  : 'text-neutral-400 group-hover:text-neutral-600'
              "
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.75"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
            <span>{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="px-4 py-3 border-t border-neutral-300">
      <p class="font-sans text-label text-neutral-400 tracking-widest uppercase">
        ITI Platform
      </p>
    </div>
  </aside>
</template>
