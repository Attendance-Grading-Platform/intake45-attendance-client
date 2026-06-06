// GRD-3: Normalization formula
export const normalize = (
    rawScore: number,
    rawMax: number,
    weight: number
): number => {
    if (!rawMax) return 0
    return parseFloat(((rawScore / rawMax) * weight).toFixed(2))
}

// ENG-2: Late penalty formula
export const applyLatePenalty = (
    score: number,
    daysLate: number
): number => {
    const penalty = daysLate * 0.25 * 10
    return Math.max(0, score - penalty)
}

// ANL-1: At-risk detection
export const isAtRisk = (
    ledgerBalance: number,
    courseGrades: number[]
): boolean => {
    if (ledgerBalance < 150) return true
    return courseGrades.some((g: number) => g < 60)
}
