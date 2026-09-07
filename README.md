# Study Flow

A full-stack student productivity web application built for Product Analytics.

## Features (Planned)

**Student Application**
- Authentication (JWT + bcrypt)
- Student dashboard
- Subjects & courses
- Assignments & task management
- Deadline tracking
- Study planner
- Pomodoro / study timer
- Progress tracking & analytics
- Reminders
- Phone usage tracking
- Sleep pattern tracking
- AI learning assistant (later)

**Admin Product Analytics Dashboard**
- DAU / WAU / MAU
- Sessions per user & duration
- Page views & actions per session
- Feature usage & adoption
- Activation rate & funnel analysis
- Retention (D1/D7/D30), churn, reactivation
- Task & study session completion rates
- User feedback & CSAT
- Error tracking & performance metrics

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Charts | Recharts (later) |

## Project Structure

```
study_flow/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route page components
│   │   ├── App.tsx       # Router setup
│   │   └── main.tsx      # Entry point
│   └── ...
├── backend/           # Express API server
│   ├── prisma/        # Prisma schema & migrations
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   └── index.ts   # Server entry point
│   └── ...
├── README.md
├── .gitignore
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

### Backend

```bash
cd backend
cp .env.example .env    # Edit with your PostgreSQL credentials
npm install
npx prisma generate
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Environment Variables

Create a `.env` file in the `backend/` directory:

```
DATABASE_URL="postgresql://user:password@localhost:5432/studyflow?schema=public"
PORT=5000
```
