# 🏋️ AI Gym Trainer

Your intelligent fitness companion — powered by AI.

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | React 19 · Vite 6 · Tailwind v4  |
| Backend    | Node.js · Express 4               |
| Database   | MongoDB · Mongoose 8              |
| HTTP       | Axios                             |

## Project Structure

```
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── assets/        # Static assets (images, fonts, etc.)
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page-level components
│   │   ├── routes/        # Route configuration
│   │   ├── services/      # API service layer (Axios)
│   │   └── utils/         # Helper utilities
│   └── ...
├── server/          # Express backend
│   ├── config/            # Database & app configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # API route definitions
│   └── utils/             # Server utilities
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** running locally or a connection string

### 1. Clone & Install

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Configure Environment

Copy the example env file and update values as needed:

```bash
cp server/.env.example server/.env
```

### 3. Run Development Servers

```bash
# Terminal 1 — Start the backend
cd server
npm run dev

# Terminal 2 — Start the frontend
cd client
npm run dev
```

- **Frontend** → [http://localhost:5173](http://localhost:5173)
- **Backend**  → [http://localhost:5000](http://localhost:5000)

## License

MIT
