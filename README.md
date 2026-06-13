# 🎓 Attendance & Grading Management Platform (ITI Intake 45/46)

A minimal luxury, high-performance Full-Stack enterprise application designed for tracking student attendance, conducting robust academic grading evaluation, and managing automated billing rollups. Built with **Vue 3 (Vite)** on the frontend and **Laravel (Dockerized)** on the backend.

---

## 🚀 Key Modules & Core Architecture

### 1. Instructor Grade Entry & Guardrails (GRD-1)
- Automated grade scaling matrices allowing safe data syncing.
- **Strict Integrity Rules:** Fully blocks grade overrides unless an official audit text note is provided via the `GradeEntryModal.vue` framework.

### 2. Track Admin Final Grading System (GRD-5)
- Fully centralized dashboard located in `src/pages/track-admin/GradesPage.vue`.
- Integrates continuous Project Grades and Final Exam components into unified batch payloads to secure state locks before final review.

### 3. Financial Billing Rollup Ledger (BIL-1 & BIL-3)
- Live computed filtering sorting variables dynamically based on Cohorts and Attendance Types.
- Features a secure single-action hook ("Export to Central Accounting") that captures logged events and registers automated financial billing cycles.

---

## 🛠️ Tech Stack & Styling Aesthetic
- **Frontend:** Vue 3 (Composition API), Pinia (State Management), TypeScript, Vite.
- **Backend:** Laravel, PostgreSQL, Docker Compose ecosystem.
- **Design System:** Tailored **Zara-inspired dynamic UI** utilizing a clean, minimal luxury black-and-white color paradigm with strict type safety.

---

## 💻 Local Development Setup

1. **Clone the project components:**
   ```bash
   git clone <repository-url>