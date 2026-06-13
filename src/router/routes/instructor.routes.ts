// src/router/routes/instructor.routes.ts
import type { RouteRecordRaw } from 'vue-router'
import InstructorLayout from '@/layouts/InstructorLayout.vue'

const routes: RouteRecordRaw[] = [
    {
        path: '/instructor',
        component: InstructorLayout,
        meta: { role: 'instructor' },
        children: [
            {
                path: 'dashboard',
                name: 'instructor-dashboard',
                component: () => import('@/pages/instructor/DashboardPage.vue'),
            },
            {
                path: 'attendance',
                name: 'instructor-attendance',
                component: () => import('@/pages/instructor/AttendancePage.vue'),
            },

            {
                path: 'grades',
                name: 'instructor-grades',
                component: () => import('@/pages/instructor/GradesPage.vue'),
            },
            {
                path: 'announcements',
                name: 'instructor-announcements',
                component: () => import('@/pages/instructor/AnnouncementsPage.vue'),
            },
            {
                path: 'deliverables',
                name: 'instructor-deliverables',
                component: () => import('@/pages/instructor/DeliverablesPage.vue'),
            },
            {
                path: 'submissions',
                name: 'instructor-submissions',
                component: () => import('@/pages/instructor/SubmissionReviewPage.vue'),
            },
        ],
    },
]

export default routes
