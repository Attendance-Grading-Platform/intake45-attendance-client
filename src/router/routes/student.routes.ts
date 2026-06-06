// src/router/routes/student.routes.ts
import type { RouteRecordRaw } from 'vue-router'
import StudentLayout from '@/layouts/StudentLayout.vue'

const routes: RouteRecordRaw[] = [
    {
        path: '/student',
        component: StudentLayout,
        meta: { role: 'student' },
        children: [
            {
                path: 'dashboard',
                name: 'student-dashboard',
                component: () => import('@/pages/student/DashboardPage.vue'),
            },
            {
                path: 'grades',
                name: 'student-grades',
                component: () => import('@/pages/student/GradesPage.vue'),
            },
            {
                path: 'attendance',
                name: 'student-attendance',
                component: () => import('@/pages/student/AttendancePage.vue'),
            },
            {
                path: 'excuses',
                name: 'student-excuses',
                component: () => import('@/pages/student/ExcusesPage.vue'),
            },
            {
                path: 'assignments',
                name: 'student-assignments',
                component: () => import('@/pages/student/AssignmentsPage.vue'),
            },
            {
                path: 'announcements',
                name: 'student-announcements',
                component: () => import('@/pages/student/AnnouncementsPage.vue'),
            },
        ],
    },
]

export default routes
