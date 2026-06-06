export const EXCUSE_STATUS = {
    REQUESTED: 'requested',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const

export const ENGAGEMENT_TYPES = {
    LECTURE: 'lecture',
    LAB: 'lab',
    BUSINESS_SESSION: 'business_session',
} as const

export const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    UNEXCUSED: 'unexcused',
    EXCUSED: 'excused',
} as const

export type ExcuseStatus = typeof EXCUSE_STATUS[keyof typeof EXCUSE_STATUS]
export type EngagementType = typeof ENGAGEMENT_TYPES[keyof typeof ENGAGEMENT_TYPES]
export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS]
