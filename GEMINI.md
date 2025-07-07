# Project: Electron Email Client

## 1. Project Overview

This project is a desktop email client built with Electron, React, and TypeScript. The goal is to provide a cross-platform email application with a modern and intuitive user interface.

## 2. Folder Structure

-   `/.erb/`: Contains configurations for webpack and other development tools.
-   `/assets/`: Contains static assets like icons, images, and fonts.
-   `/release/`: Contains the packaged application and installers.
-   `/src/`: Contains the source code for the application.
    -   `/src/main/`: Contains the main process code for Electron.
    -   `/src/renderer/`: Contains the renderer process code (React application).
    -   `/src/common/`: Contains code shared between the main and renderer processes.

## 3. Coding Standards

-   **Language:** TypeScript
-   **Style Guide:** ESLint and Prettier are used for code linting and formatting. Please adhere to the existing rules.
-   **Naming Conventions:**
    -   Components: PascalCase (e.g., `EmailList.tsx`)
    -   Functions and variables: camelCase (e.g., `getEmails()`)
    -   Interfaces and types: PascalCase (e.g., `Email`)

## 4. Key Dependencies

-   **Electron:** The core framework for building the desktop application.
-   **React:** Used for building the user interface.
-   **TypeScript:** The primary programming language.
-   **webpack:** Used for bundling the code.
-   **react-router-dom:** For navigation within the React application.
-   **tailwindcss:** For styling the application.

## 5. Available Scripts

-   `pnpm start`: Starts the application in development mode with hot reloading.
-   `pnpm build`: Builds the application for production.
-   `pnpm package`: Packages the application for distribution.
-   `pnpm test`: Runs the tests using Jest.
-   `pnpm lint`: Lints the code using ESLint.

## 6. Custom Instructions

-   When adding new components, please follow the existing structure in `src/renderer/components`.
-   For state management, prefer React Hooks and Context API over other libraries unless a more complex solution is required.
-   All new features should have corresponding tests.
-   Ensure that any changes to the main process are properly tested on all target platforms (Windows, macOS, Linux).
