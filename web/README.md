# Sub-Grant Management Platform - Web Application

This is the web application component of the Sub-Grant Management Platform. It provides a user interface for managing sub-grant programs, including partner onboarding, budget management, digital contracts, disbursements, and reporting.

## Features

- User authentication and authorization
- Partner organization management
- Budget creation and approval workflows
- Digital contract generation and signing
- Disbursement tracking and reconciliation
- Monitoring and evaluation reporting
- Financial retirement and reconciliation
- Document management with versioning
- Notifications and alerts
- Role-based dashboards

## Technology Stack

- **Frontend Framework**: React.js with TypeScript
- **State Management**: React Context API
- **Routing**: React Router
- **Build Tool**: Create React App
- **Styling**: CSS Modules
- **API Communication**: Fetch API

## Prerequisites

- Node.js (version 16 or later)
- npm (version 8 or later) or yarn (version 1.22 or later)

## Getting Started

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

   This will run the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### Development

- The page will reload if you make edits
- You will also see any lint errors in the console

### Build

To build the app for production:
```
npm run build
```

This builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React context providers
├── pages/             # Page components
├── services/          # API service functions
├── utils/             # Utility functions
├── App.tsx            # Main application component
├── index.tsx          # Entry point
└── react-app-env.d.ts # TypeScript declarations
```

## Environment Variables

The application uses the following environment variables (defined in `.env`):

- `REACT_APP_API_URL`: The URL of the backend API
- `REACT_APP_NAME`: The application name
- `REACT_APP_VERSION`: The application version
- `REACT_APP_MFA_ENABLED`: Whether MFA is enabled
- `REACT_APP_NOTIFICATIONS_ENABLED`: Whether notifications are enabled
- `GENERATE_SOURCEMAP`: Whether to generate source maps (development only)

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner in interactive watch mode
- `npm run build`: Builds the app for production
- `npm run eject`: Removes the single-build dependency (irreversible)

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).