// src/router/routes/auth.routes.ts
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/pages/auth/LoginPage.vue'),
    },
    {
        path: '/forgot-password',
        name: 'forgot-password',
        component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    },
    {
        path: '/reset-password',
        name: 'reset-password',
        component: () => import('@/pages/auth/ResetPasswordPage.vue')
    }
]

export default routes
