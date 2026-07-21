# AI Gym Trainer — Task List

## Backend (Authentication & Habits API)
- [x] Install `bcryptjs`, `jsonwebtoken`, `cookie-parser`
- [x] Create User model (`server/models/User.js`)
- [x] Create auth middleware (`server/middleware/auth.js`)
- [x] Create auth controller (`server/controllers/authController.js`)
- [x] Create auth routes (`server/routes/authRoutes.js`)
- [x] Update `server/routes/index.js` — register auth routes
- [x] Update `server/server.js` — add cookie-parser
- [x] Update `server/.env` — add JWT_SECRET, JWT_EXPIRES_IN
- [x] Create Habit Model (`server/models/Habit.js`)
- [x] Create Habit Controller (`server/controllers/habitController.js`) with dynamic streak calculation
- [x] Create Habit Routes (`server/routes/habitRoutes.js`)
- [x] Register Habit routes in `server/routes/index.js`

## Frontend (Authentication, Dashboard, & Habits CRUD)
- [x] Create auth service (`client/src/services/authService.js`)
- [x] Create AuthContext (`client/src/context/AuthContext.jsx`)
- [x] Create ProtectedRoute (`client/src/components/ProtectedRoute.jsx`)
- [x] Create Login page (`client/src/pages/Login.jsx`)
- [x] Create Register page (`client/src/pages/Register.jsx`)
- [x] Create Sidebar component (`client/src/components/layout/Sidebar.jsx`)
- [x] Create TopNav component (`client/src/components/layout/TopNav.jsx`)
- [x] Create DashboardLayout component (`client/src/components/layout/DashboardLayout.jsx`)
- [x] Create Habit Service (`client/src/services/habitService.js`)
- [x] Create Habit Context (`client/src/context/HabitContext.jsx`)
- [x] Wrap in `main.jsx` with `HabitProvider`
- [x] Create/Update Habits page (`client/src/pages/Habits.jsx`) with full CRUD interactive UI
- [x] Update Dashboard page (`client/src/pages/Dashboard.jsx`) to load and toggle real habits
- [x] Create placeholder pages: Workouts, Progress, Settings
- [x] Update `AppRoutes.jsx` — configure layout, public routes, and nested protected routes

## Verification
- [x] Start backend and frontend servers
- [x] Register, login, and verify redirection logic
- [x] Verify Add Habit, Edit Habit, Delete Habit on Habits tab
- [x] Verify Today's Habit checklist, Streak card, and progress calculation on Dashboard tab
