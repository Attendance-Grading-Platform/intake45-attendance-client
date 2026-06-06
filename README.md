# ITI Attendance & Grading Platform — intake45-attendance-client

> **Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS + shadcn-vue**
> A robust frontend client for managing branch-wide attendance, grading, and scheduling at ITI.

---

## 🌟 Features

- **Role-Based Portals**: Dedicated interfaces for Branch Managers, Track Admins, Instructors, and Students.
- **Attendance Management**: QR code scan-in/out and a standalone 250-point attendance ledger.
- **Grading System**: Automated normalization, late penalties for lab deliverables, and Track Admin overrides.
- **Analytics Dashboards**: At-risk student detection, cohort performance trends, and grader-consistency checks.
- **Modular Architecture**: Clean separation of concerns with domain-driven API modules and strict TypeScript typing.

---

## 🛠️ Project Setup

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation
```bash
npm install
```

### Environment Configuration
Copy the example environment file and update it with your backend API URL:
```bash
cp .env.example .env
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 📜 Contributing Rules

Before contributing, please review the [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- **Branch Naming**: `type/REQUIREMENT-ID-description`
- **Commit Messages**: `type(scope): [REQUIREMENT-ID] description`
- **TypeScript & Coding Standards**

---

## 🏗️ Architecture Overview

- `src/api/`: Modular HTTP clients and Axios interceptors.
- `src/components/`: Reusable UI components grouped by use casing (charts, forms, shared, tables).
- `src/pages/`: Role-scanned page definitions.
- `src/stores/`: Shared state using Pinia setup stores.
- `src/types/`: Strict data shape definitions.
- `src/utils/`: Pure business logic (e.g., normalization, penalties).

---

*ITI Attendance & Grading Platform — v2.0*
