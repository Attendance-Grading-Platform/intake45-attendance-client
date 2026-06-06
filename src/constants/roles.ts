export const ROLES = {
    BRANCH_MANAGER: 'branch_manager',
    TRACK_ADMIN: 'track_admin',
    INSTRUCTOR: 'instructor',
    STUDENT: 'student',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]
