// src/router/routes/branch-manager.routes.ts
import type { RouteRecordRaw } from 'vue-router'
import BranchManagerLayout from '@/layouts/BranchManagerLayout.vue'

const routes: RouteRecordRaw[] = [
    {
        path: '/branch-manager',
        component: BranchManagerLayout,
        meta: { role: 'branch_manager' },
        children: [
            {
                path: 'dashboard',
                name: 'branch-manager-dashboard',
                component: () => import('@/pages/branch-manager/DashboardPage.vue'),
            },
            {
                path: 'tracks',
                name: 'branch-manager-tracks',
                component: () => import('@/pages/branch-manager/TracksPage.vue'),
            },
            {
                path: 'cohorts',
                name: 'branch-manager-cohorts',
                component: () => import('@/pages/branch-manager/CohortsPage.vue'),
            },
            {
                path: 'cohorts/:cohortId',
                name: 'branch-manager-cohort-detail',
                component: () => import('@/pages/branch-manager/CohortOverviewPage.vue'),
            },
            {
                path: 'analytics',
                name: 'branch-manager-analytics',
                component: () => import('@/pages/branch-manager/AnalyticsPage.vue'),
            },
            {
                path: 'billing',
                name: 'branch-manager-billing',
                component: () => import('@/pages/branch-manager/BillingPage.vue'),
            },
        ],
    },
]

export default routes
