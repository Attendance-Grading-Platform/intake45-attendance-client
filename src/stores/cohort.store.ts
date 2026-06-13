import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Cohort } from '@/types/cohort.types'
import * as cohortApi from '@/api/modules/cohort.api'
import axios from "@/api/axios"

export interface BaseUser {
  id: number;
  name: string;
}

export interface StudentTagNote {
  id: number;
  student_id: number;
  tag: string;
  note: string | null;
  creator_id: number;
  created_at: string;
  updated_at: string;
  creator: BaseUser;
}

export interface GradeBreakdown {
  course_name: string;
  component_type: string;
  raw_score: number;
  raw_max: number;
  component_weight: number;
  normalized_score: number;
}

export interface StudentAnalytics {
  student: BaseUser;
  ledger_balance: number;
  is_at_risk: boolean;
  grades_breakdown: GradeBreakdown[];
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  arrived_at: string | null;
  left_at: string | null;
  session?: {
    session_date: string;
    engagement?: {
      title: string;
    };
  };
}

export const useCohortStore = defineStore('cohort', () => {
    // 1. New Cohort List State
    const cohorts = ref<Cohort[]>([])
    const students = ref<unknown[]>([])
    const isLoading = ref(false)

    // 2. Drawer UI State
    const isStudentDrawerOpen = ref(false);
    const isProfileLoading = ref(false);

    // 3. Profile Context State
    const activeStudentId = ref<number | null>(null);
    const activeStudentName = ref("");
    const activeCohortName = ref("");
    const activeLabGroupName = ref("");

    // 4. Profile API Data State
    const tags = ref<StudentTagNote[]>([]);
    const notes = ref<StudentTagNote[]>([]);
    const analytics = ref<StudentAnalytics | null>(null);
    const attendanceRecords = ref<AttendanceRecord[]>([]);

    async function fetchCohorts() {
        isLoading.value = true
        try {
            const res = await cohortApi.getCohorts()
            cohorts.value = res.data.data ?? []
        } catch {
            cohorts.value = []
        } finally {
            isLoading.value = false
        }
    }

    async function fetchCohortStudents(cohortId: number) {
        isLoading.value = true
        try {
            const res = await cohortApi.getCohortStudents(cohortId)
            students.value = res.data.data ?? []
        } catch {
            students.value = []
        } finally {
            isLoading.value = false
        }
    }

    // 5. Drawer Orchestrator Action
    const openStudentProfile = async (id: number, name: string, cohort: string, labGroup: string) => {
      activeStudentId.value = id;
      activeStudentName.value = name;
      activeCohortName.value = cohort;
      activeLabGroupName.value = labGroup;

      isStudentDrawerOpen.value = true;
      isProfileLoading.value = true;

      try {
        const [tagsRes, notesRes, analyticsRes, attendanceRes] = await Promise.allSettled([
          axios.get(`/v1/students/${id}/tags`),
          axios.get(`/v1/students/${id}/notes`),
          axios.get(`/v1/students/${id}/analytics`),
          axios.get(`/v1/students/${id}/attendance`),
        ]);

        if (tagsRes.status === "fulfilled") tags.value = tagsRes.value.data.data || [];
        else if (tagsRes.reason?.response?.status === 403) {
            closeStudentProfile();
            alert("You do not have permission to view this student's profile.");
            return;
        }
        
        if (notesRes.status === "fulfilled") notes.value = notesRes.value.data.data || [];
        if (analyticsRes.status === "fulfilled") analytics.value = analyticsRes.value.data.data || null;
        if (attendanceRes.status === "fulfilled") attendanceRecords.value = attendanceRes.value.data.data.records || [];
      } catch (error) {
        console.error("Failed to fetch student profile data:", error);
      } finally {
        isProfileLoading.value = false;
      }
    };

    const closeStudentProfile = () => {
      isStudentDrawerOpen.value = false;
      setTimeout(() => {
        activeStudentId.value = null;
        tags.value = [];
        notes.value = [];
        analytics.value = null;
        attendanceRecords.value = [];
      }, 300);
    };

    return { 
      cohorts, students, isLoading, fetchCohorts, fetchCohortStudents,
      isStudentDrawerOpen, isProfileLoading, activeStudentId, activeStudentName, 
      activeCohortName, activeLabGroupName, tags, notes, analytics, attendanceRecords,
      openStudentProfile, closeStudentProfile
    }
})
