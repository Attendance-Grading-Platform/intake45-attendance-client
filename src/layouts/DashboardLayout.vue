<script setup lang="ts">
import { ref } from 'vue'
import AppHeader  from '@/layouts/AppHeader.vue'
import AppSidebar from '@/layouts/AppSidebar.vue'
import AppFooter  from '@/layouts/AppFooter.vue'

const sidebarOpen = ref<boolean>(true)
</script>

<template>
  <div class="min-h-screen bg-brand-surface flex flex-col">
    <AppHeader
      :sidebar-open="sidebarOpen"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <div class="flex flex-1">
      <AppSidebar :open="sidebarOpen" />

      <main
        class="flex-1 flex flex-col min-h-[calc(100vh-56px)] transition-all duration-200"
        :class="sidebarOpen ? 'ml-[240px]' : 'ml-0'"
      >
        <div class="flex-1 p-8 max-w-content mx-auto w-full">
          <slot>
            <RouterView />
          </slot>
        </div>
        <AppFooter />
      </main>
    </div>
  </div>
</template>
