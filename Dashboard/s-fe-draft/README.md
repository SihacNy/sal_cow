# CowFit Dashboard

CowFit is a modern, responsive dashboard application for monitoring livestock. It tracks cow weights, scale device battery levels, and provides real-time alerts.

## 🛠️ Technology Stack & Libraries

This project is built with a modern frontend stack to ensure performance, maintainability, and a beautiful user interface.

### Core Architecture
- **[React 19](https://react.dev/)**: The core UI library used to build the component-based architecture of the application.
- **[TypeScript](https://www.typescriptlang.org/)**: Provides static typing to JavaScript, catching errors early during development and improving code readability and maintainability.
- **[Vite](https://vitejs.dev/)**: A lightning-fast build tool and development server that provides near-instant hot module replacement (HMR).

### Styling & UI
- **[Tailwind CSS (v4)](https://tailwindcss.com/)**: A utility-first CSS framework used for all styling. It allows for rapid UI development and ensures a consistent, responsive design without writing custom CSS files.
- **[Lucide React](https://lucide.dev/)**: A beautiful, consistent open-source icon toolkit. We use this for all the vector UI icons across the dashboard (like the navigation items, search, and battery indicators).

### Data Visualization
- **[Recharts](https://recharts.org/)**: A composable charting library built on React components. It is used to render the dynamic "Average Weight Trend" area chart on the dashboard, making data easy to visualize.

### Internationalization (i18n)
- **[i18next](https://www.i18next.com/) & [react-i18next](https://react.i18next.com/)**: Used to handle multi-language support. Currently, it powers the language toggle in the header, allowing users to seamlessly switch between English (EN) and Khmer (ខ្មែរ) translations.

## 🚀 Getting Started

1. Install dependencies: `npm install`
2. Run the development server: `npm run dev`
3. Build for production: `npm run build`