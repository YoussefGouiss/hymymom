# HymyMom Pro 🕊️

**Professional Intelligence for Postpartum Doulas.**

HymyMom Pro is a clinical sanctuary designed to automate administrative friction and elevate the quality of postpartum care. Built for the modern doula, it provides a secure, beautiful, and intuitive workspace to manage families, clinical notes, and practice growth.

---

## ✨ Core Features

- **🛡️ Secure Family Sanctuary**: Comprehensive family profiles with medical history, personal preferences, and secure data isolation.
- **📝 Clinical Intelligence**: Sophisticated session notes with the ability to "pin" urgent observations and track recovery trajectories.
- **📅 Visual Visit Management**: A calm, organized calendar to coordinate visits and ensure no family is left unsupported.
- **💰 Financial Clarity**: Effortless payment tracking and contribution logging with a clean audit trail.
- **🔔 Smart Practice Reminders**: Automated prompts for follow-ups, clinical check-ins, and administrative tasks.
- **📊 Professional Dashboard**: A bird's-eye view of your entire practice, highlighting priorities and upcoming visits.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Environment Setup
Create a `.env.local` file in the root directory and add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

---

## 📁 Project Structure

- `src/app`: Next.js App Router (Pages & API routes)
- `src/components`: Reusable UI components
- `src/context`: Global state management (Auth, Theme)
- `src/lib`: Utility functions and third-party clients
- `infra/migrations`: SQL scripts for database schema setup
- `infra/docs`: Detailed technical documentation and feature specs

---

## 🔒 Security & Privacy

HymyMom Pro is built with a "Privacy-First" architecture. Every query is strictly filtered by `user_id` to ensure absolute data isolation between doula practices.

---

## 📄 License

Proprietary. All rights reserved.
