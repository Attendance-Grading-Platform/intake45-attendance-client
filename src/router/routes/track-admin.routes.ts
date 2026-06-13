// src/router/routes/track-admin.routes.ts
import type { RouteRecordRaw } from 'vue-router'
import TrackAdminLayout from '@/layouts/TrackAdminLayout.vue'

const routes: RouteRecordRaw[] = [
    {
        path: '/track-admin',
        component: TrackAdminLayout,
        meta: { role: 'track_admin' },
        children: [
            {
                path: 'dashboard',
                name: 'track-admin-dashboard',
                component: () => import('@/pages/track-admin/DashboardPage.vue'),
            },
            {
                path: 'students',
                name: 'track-admin-students',
                component: () => import('@/pages/track-admin/StudentsPage.vue'),
            },
            {
                path: 'cohorts/:cohortId/lab-groups',
                name: 'track-admin-lab-groups',
                component: () => import('@/pages/track-admin/LabGroupsPage.vue'),
            },
            {
                path: 'courses',
                name: 'track-admin-courses',
                component: () => import('@/pages/track-admin/CoursesPage.vue'),
                meta: { requiresAuth: true, role: 'track_admin' },
            },
            {
                path: 'engagements',
                name: 'track-admin-engagements',
                component: () => import('@/pages/track-admin/EngagementsPage.vue'),
            },
            {
                path: 'engagements/create',
                name: 'track-admin-engagement-create',
                component: () => import('@/pages/track-admin/EngagementFormPage.vue'),
            },
            {
                path: 'engagements/:id',
                name: 'track-admin-engagement-details',
                component: () => import('@/pages/track-admin/EngagementDetailsPage.vue'),
            },
            {
                path: 'attendance',
                name: 'track-admin-attendance',
                component: () => import('@/pages/track-admin/AttendancePage.vue'),
            },
            {
                path: 'grades',
                name: 'track-admin-grades',
                component: () => import('@/pages/track-admin/GradesPage.vue'),
            },
            {
                path: 'billing',
                name: 'track-admin-billing',
                component: () => import('@/pages/track-admin/BillingDetailPage.vue'),
            },
            {
                path: 'excuses',
                name: 'track-admin-excuses',
                component: () => import('@/pages/track-admin/ExcusesPage.vue'),
            },
            {
                path: 'at-risk',
                name: 'track-admin-at-risk',
                component: () => import('@/pages/track-admin/AtRiskPage.vue'),
            },
            {
                path: 'announcements',
                name: 'track-admin-announcements',
                component: () => import('@/pages/track-admin/AnnouncementsPage.vue'),
            },
            {
                path: 'cohorts/:cohortId/overview',
                name: 'track-admin-cohort-overview',
                component: () => import('@/pages/track-admin/CohortOverviewPage.vue'),
                meta: { requiresAuth: true, role: 'track_admin' },
            },
        ],
    },
]

export default routes
