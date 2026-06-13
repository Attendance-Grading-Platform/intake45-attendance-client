<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Vue.png" width="100" alt="Vue Logo">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Vitejs-logo.svg" width="100" alt="Vite Logo">

  <br />
  <br />

  [![Vue](https://img.shields.io/badge/Vue.js-3.x-4FC08D.svg?style=for-the-badge&logo=vue.js&logoColor=white)](https://vuejs.org)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
  [![Pinia](https://img.shields.io/badge/Pinia-Store-F6D365.svg?style=for-the-badge&logo=vue.js&logoColor=white)](https://pinia.vuejs.org/)

  <h3 align="center">ITI Attendance & Grading Platform - Client</h3>

  <p align="center">
    A dynamic, type-safe, and highly responsive dashboard for academic tracking.
    <br />
    <a href="#about-the-project"><strong>Explore the docs »</strong></a>
  </p>
</div>

---

<details open>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#technology-stack">Technology Stack</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#seeded-test-accounts">Seeded Test Accounts</a></li>
    <li><a href="#assumptions--technical-decisions">Assumptions & Technical Decisions</a></li>
    <li><a href="#meet-the-team">Meet The Team</a></li>
  </ol>
</details>

---

## 📖 About The Project

This repository contains the **Vue 3 Frontend Client** for the ITI Attendance and Grading Platform. It provides a seamless, Single-Page Application (SPA) experience for four distinct user roles: Branch Managers, Track Admins, Instructors, and Students. 

The dashboard is engineered to present complex analytics, grading queues, and attendance ledgers through beautiful, responsive UI components powered by Tailwind CSS.

---

## 🛠️ Technology Stack

* **Core Framework:** Vue 3 (Composition API)
* **Build Tool:** Vite 5
* **Language:** TypeScript 5
* **Styling:** Tailwind CSS 3
* **State Management:** Pinia
* **Routing:** Vue Router 4
* **HTTP Client:** Axios
* **Icons:** Heroicons

---

## ✨ Key Features

- 🎨 **Modern Aesthetics:** Fully responsive, sleek, and premium user experience featuring glassmorphism elements, dynamic sidebars, and fluid transitions.
- 🛡️ **End-to-End Type Safety:** Strict TypeScript interfaces (e.g., `AtRiskStudent`, `CohortStudent`) guarantee predictable data rendering and eliminate runtime `undefined` errors.
- 🚦 **Dynamic Role-Based Routing:** Navigation guards instantly adapt the UI based on the user's role. If a Student tries to access an Instructor dashboard, they are seamlessly redirected.
- 📈 **Real-Time Analytics:** Dashboards feature interactive metrics, grading throughput indicators, and immediate risk-assessment panels.
- 🧩 **Modular Component System:** Highly reusable forms (`TextInput`, `FileUpload`), data tables, and modal components ensure consistency across the application.

---

## 🚀 Getting Started

Follow these steps to configure and run the frontend client locally.

### Prerequisites
* Node.js >= 18.0.0
* npm >= 9.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Attendance-Grading-Platform/intake45-attendance-client.git
   cd intake45-attendance-client
   ```

2. **Install Node Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set the backend API URL. For a local Laravel backend, use:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *The application will be served at `http://localhost:5173`.*

5. **Build for Production**
   ```bash
   npm run build
   ```
   *Note: Our strict TypeScript configuration will fail the build if there are any typing errors. Ensure all code is strictly typed.*

---

## 🔑 Seeded Test Accounts

Assuming your backend is running the provided database seeders, you can use these accounts to explore the different dashboards.

**Password for ALL accounts:** `password`

| Role | Email Address | Dashboard Access |
| :--- | :--- | :--- |
| **Branch Manager** | `manager@iti.edu.eg` | System-wide Analytics, Billing Approval |
| **Track Admin** | `karim.ashraf@iti.edu.eg` | Web Track Configuration |
| **Track Admin** | `nour.samir@iti.edu.eg` | Mobile Track Configuration |
| **Instructor** | `amira.khaled@iti.edu.eg` | Grading Queue, Session Management |
| **Student** | `ahmed.ali.46@student.iti.edu.eg` | Submissions, Excuses, Progress |
| **Student** | `adam.sherif.46@student.iti.edu.eg`| Submissions, Excuses, Progress |

---

## 🧠 Assumptions & Technical Decisions

1. **Concrete Interfaces over Unknown Types:**
   The frontend strictly avoids `any` and `unknown[]`. Every API response object is strongly typed. This architectural choice prevents silent failures in Vue templates when rendering complex nested properties.
   
2. **Client-Side Authorization Strategy:**
   While the backend handles secure data scoping, the frontend manages visual authorization. We utilize a Pinia `auth.store.ts` that persists the user's role. Vue Router navigation guards intercept route changes and verify the role before rendering the view.
   
3. **Handling File Attachments:**
   The UI generates direct URLs to the backend's `/storage/` directory for opening documents. If the backend is deployed on an ephemeral container service (like Railway without a mounted volume), files uploaded prior to a redeploy will naturally return a `404 Not Found`.
   
4. **API Integration:**
   All API calls are centralized in the `src/api/modules/` directory. Axios interceptors are configured to automatically attach the Sanctum Bearer token and handle global error states (like `401 Unauthorized`).

---

## 👥 Meet The Team

This project was brought to life by an incredible team of developers:

* **Mostafa Khalifa** - [@Mostafa-Khalifaa](https://github.com/Mostafa-Khalifaa)
* **Alaa Abdullah** - [@AlaaAbdullah13](https://github.com/AlaaAbdullah13)
* **Hashim Abdulaziz** - [@HashimAbdulaziz](https://github.com/HashimAbdulaziz)
* **Haneen Elasawy** - [@Haneenelasawy](https://github.com/Haneenelasawy)
* **Mohamed Hamdy** - [@mohamedhamdy1](https://github.com/mohamedhamdy1)

<div align="center">
  <sub>Built with ❤️ at the Information Technology Institute (ITI).</sub>
</div>
