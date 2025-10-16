# Project Overview

This is a Next.js 14 project for the Collaborium Platform, a fan collaboration platform for artists. It uses the App Router, Tailwind CSS, and shadcn/ui.

**Key Technologies:**

*   **Framework:** Next.js 14
*   **Styling:** Tailwind CSS, shadcn/ui
*   **Database:** Prisma
*   **Authentication:** NextAuth
*   **Payments:** Stripe
*   **Internationalization:** i18next
*   **State Management:** Zustand
*   **Data Fetching:** React Query
*   **Testing:** Jest, React Testing Library, Playwright

**Architecture:**

*   The project follows a feature-based structure with a clear separation of concerns.
*   The `app` directory contains the main application logic, with subdirectories for different features like `projects`, `artists`, `community`, etc.
*   The `lib` directory contains shared utilities, server-side logic, and authentication-related code.
*   The `components` directory contains reusable UI components.
*   The `prisma` directory contains the database schema and seed scripts.

# Building and Running

**Installation:**

```bash
npm install
```

**Development:**

```bash
npm run dev
```

**Testing:**

```bash
npm test
```

**E2E Testing:**

```bash
npm run test:e2e
```

**Production Build:**

```bash
npm run build
```

# Development Conventions

*   **Branching:** The project follows a Trunk-Based Development model. Feature branches should be short-lived and frequently rebased with the main branch.
*   **Commits:** Commit messages should follow the Conventional Commits specification.
*   **Pull Requests:** PRs should be small and focused. They must pass all CI checks and be approved by at least one reviewer before being merged.
*   **Code Style:** The project uses ESLint and Prettier to enforce a consistent code style.
*   **Testing:** The project has a comprehensive test suite that includes unit, integration, and end-to-end tests. All new features should be accompanied by tests.
