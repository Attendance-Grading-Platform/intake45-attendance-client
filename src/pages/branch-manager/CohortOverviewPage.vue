<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES } from '@/constants/roles'
import CohortOverview from '@/pages/track-admin/CohortOverviewPage.vue'

// This page currently reuses the Track Admin's overview 
// but we wrap it to ensure it renders in the Branch Manager's context.
// In a full implementation, we might customize the quick links based on role.
</script>

<template>
  <CohortOverview />
</template>
