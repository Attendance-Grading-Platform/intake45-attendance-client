// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from './guards'

// Import route modules
import authRoutes from './routes/auth.routes.ts'
import studentRoutes from './routes/student.routes.ts'
import instructorRoutes from './routes/instructor.routes.ts'
import trackAdminRoutes from './routes/track-admin.routes.ts'
import branchManagerRoutes from './routes/branch-manager.routes.ts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...authRoutes,
    ...studentRoutes,
    // Add other routes as they are implemented
    // ...instructorRoutes,
    // ...trackAdminRoutes,
    // ...branchManagerRoutes,
  ],
})

// Navigation guards
router.beforeEach(authGuard)

export default router
