# Frontend Contributing Guide
# intake45-attendance-client

> Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS + shadcn-vue

---

## 🚀 Welcome to the Team!

This project is structured for a clean, modular, and role-based architecture. Before you start coding, please read these rules carefully to ensure consistency across the team.

---

## 1. Project Structure

The project follows a domain-driven architectural pattern:

- **src/api/**: All HTTP calls. No logic, no UI.
  - `axios.ts`: Configured instance with interceptors for auth.
  - `modules/`: API calls grouped by domain (e.g., `auth.api.ts`, `grade.api.ts`).
- **src/components/**: Categorized Vue components.
  - `ui/`: shadcn-vue auto-generated (DO NOT EDIT).
  - `shared/`: Generic components (badges, buttons, alerts).
  - `charts/`, `forms/`, `tables/`: Specific UI patterns.
- **src/composables/**: Reusable business logic (e.g., `useGrades`, `useAuth`).
- **src/constants/**: Enums and static values (roles, statuses).
- **src/layouts/**: Role-specific layouts (e.g., `StudentLayout.vue`).
- **src/pages/**: Organized by role folders.
- **src/router/routes/**: Modular route definitions.
- **src/stores/**: Pinia shared state (using setup store syntax).
- **src/types/**: Strict TypeScript interfaces for all data.
- **src/utils/**: Pure helper functions (no Vue, no API).

---

## 2. Branch & Commit Rules

### Branch Naming
Format: `type/REQUIREMENT-ID-short-description`
Example: `feat/ATT-1-qr-scanner-checkin`

| Type | Description |
|------|-------------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `ui/` | Styling/Design only |
| `refactor/` | Code structure changes |

### Commit Messages
Format: `type(scope): [REQUIREMENT-ID] description`
Example: `feat(attendance): [ATT-1] add QR scanner component`

---

## 3. TypeScript & Coding Standards

- **Strict Typing**: No `any`. Use `ApiResponse<T>` for API responses.
- **Composition API**: Always use `<script setup lang="ts">`.
- **Naming**:
  - Components: PascalCase (`GradesTable.vue`)
  - APIs: camelCase + `.api.ts` (`grade.api.ts`)
  - Composables: `use` prefix (`useGrades.ts`)
- **No API in UI**: Components should use composables or stores, not axios directly.

---

## 4. What is Done & Ready

- [x] Full directory skeleton created.
- [x] Base types (Auth, Attendance, Grades, etc.) defined in `src/types/`.
- [x] Core Constants (Roles, Statuses) implemented in `src/constants/`.
- [x] Axios instance with auth interceptors ready in `src/api/axios.ts`.
- [x] Example Grade API and `useGrades` composable implemented.
- [x] Auth store and Router guards skeleton implemented.
- [x] Student routes and layout stubs created.

---

## 5. Quick Business Rules (Cheat Sheet)

- **Attendance**: Ledger starts at **250**. Unexcused absence = **-25**, Excused = **-5**.
- **At-Risk**: Triggered if Ledger < **150** OR any course grade < **60**.
- **Grading**: Courses are out of **100**. Penalty for late lab = **25% per day**.
- **Roles**: Ensure every API call in the backend is scoped (BM > TA > Instructor > Student).

---

*ITI Attendance & Grading Platform — v2.0*
