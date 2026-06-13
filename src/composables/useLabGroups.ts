import { ref, watch } from 'vue'
import {
    listStudents,
    listLabGroups,
    listInstructors,
    createLabGroup,
    assignStudents,
    assignInstructor,
    removeStudent
} from '@/api/modules/lab-group.api'
import type { Student, LabGroup, LabGroupStudent } from '@/types/cohort.types'
import type { UserSummary } from '@/api/modules/user.api'

export function useLabGroups(cohortId: number) {
    const unassigned = ref<LabGroupStudent[]>([])
    const groups = ref<LabGroup[]>([
        { id: 0, name: 'Group 1', instructor: null, students: [] },
        { id: 0, name: 'Group 2', instructor: null, students: [] },
        { id: 0, name: 'Group 3', instructor: null, students: [] },
    ])
    const instructors = ref<UserSummary[]>([])
    const groupCount = ref<2 | 3>(3)

    const loadingData = ref(false)
    const saving = ref(false)
    const isDirty = ref(false)
    const errors = ref<string[]>([])

    async function fetchAll() {
        loadingData.value = true
        errors.value = []
        try {
            const [studentsRes, groupsRes, instructorsRes] = await Promise.all([
                listStudents(cohortId),
                listLabGroups(cohortId),
                listInstructors()
            ])

            const allStudents = studentsRes.data.data
            const existingGroups = groupsRes.data.data
            instructors.value = instructorsRes.data.data

            if (existingGroups.length > 0) {
                // Pre-populate with existing groups
                groupCount.value = existingGroups.length as 2 | 3
                groups.value = existingGroups.map(g => ({
                    id: g.id,
                    name: g.name,
                    instructor: g.instructor,
                    students: g.students
                }))

                // Add empty groups if existing count < selected groupCount
                while (groups.value.length < groupCount.value) {
                    groups.value.push({
                        id: 0,
                        name: `Group ${groups.value.length + 1}`,
                        instructor: null,
                        students: []
                    })
                }
            }

            // ── Deduplication: Ensure a student is only in ONE group ──────────────────
            const seenStudentIds = new Set<number>()

            groups.value.forEach(group => {
                group.students = group.students.filter(s => {
                    if (seenStudentIds.has(s.id)) return false
                    seenStudentIds.add(s.id)
                    return true
                })
            })

            // Unassigned students are those NOT in any group
            unassigned.value = allStudents.filter(s => !seenStudentIds.has(s.id))

            isDirty.value = false
        } catch (err) {
            console.error('Fetch lab groups failed:', err)
            errors.value.push('Failed to load lab group data.')
        } finally {
            loadingData.value = false
        }
    }

    function setGroupCount(n: 2 | 3) {
        if (n === groupCount.value) return

        if (n === 2 && groups.value.length === 3) {
            const group3 = groups.value[2]
            if (group3 && group3.students.length > 0) {
                // Move students back to unassigned
                unassigned.value.push(...group3.students)
            }
            groups.value.splice(2, 1)
        } else if (n === 3 && groups.value.length === 2) {
            groups.value.push({
                id: 0,
                name: 'Group 3',
                instructor: null,
                students: []
            })
        }

        groupCount.value = n
        isDirty.value = true
    }

    function autoDistribute() {
        // Collect all students
        const allStudents = [
            ...unassigned.value,
            ...groups.value.flatMap(g => g.students)
        ]

        // Shuffle (Fisher-Yates)
        for (let i = allStudents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = allStudents[i]
            if (temp && allStudents[j]) {
                allStudents[i] = allStudents[j]!
                allStudents[j] = temp
            }
        }

        // Distribute
        const count = groupCount.value
        const baseSize = Math.floor(allStudents.length / count)
        let remainder = allStudents.length % count

        unassigned.value = []
        let offset = 0
        groups.value.forEach((group, i) => {
            const size = baseSize + (remainder > 0 ? 1 : 0)
            group.students = allStudents.slice(offset, offset + size)
            offset += size
            remainder--
        })

        isDirty.value = true
    }

    async function saveGroups() {
        // Validation
        if (unassigned.value.length > 0) {
            throw new Error('All students must be assigned to a group.')
        }
        for (const g of groups.value) {
            // Only validate non-empty groups
            if (g.students.length > 0) {
                if (!g.instructor) {
                    throw new Error(`Group "${g.name}" has students but no instructor assigned.`)
                }
            }
        }

        saving.value = true
        try {
            for (const group of groups.value) {
                let groupId = group.id

                // 1. Create group if it doesn't exist
                if (groupId === 0) {
                    const res = await createLabGroup(cohortId, { name: group.name })
                    groupId = res.data.data.id
                    group.id = groupId
                } else {
                    // Possible update group name logic here if needed
                }

                // 2. Assign students
                await assignStudents(groupId, {
                    user_ids: group.students.map(s => s.id)
                })

                // 3. Assign instructor (only if one is selected)
                if (group.instructor) {
                    await assignInstructor(groupId, {
                        user_ids: [group.instructor.id]
                    })
                }
            }
            isDirty.value = false
        } catch (err) {
            console.error('Save groups failed:', err)
            throw err
        } finally {
            saving.value = false
        }
    }

    return {
        unassigned,
        groups,
        instructors,
        groupCount,
        loadingData,
        saving,
        isDirty,
        errors,
        fetchAll,
        autoDistribute,
        setGroupCount,
        saveGroups
    }
}
