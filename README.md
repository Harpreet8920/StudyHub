# StudyHub Lite - Student Task Manager (Upgraded)

StudyHub is a full-stack task management app for students, featuring secure authentication, task planning, notes, and dashboard insights in a clean and minimal interface.

## Tech Stack

- Frontend: React (JavaScript, CSS)
- Backend: Node.js + Express
- Database: MySQL
- Authentication: JWT + bcryptjs

## Features

- Public home page with protected dashboard flow
- User signup/login with JWT-based auth
- Task CRUD with:
  - Edit task details
  - Status toggle (pending/completed)
  - Priority (low/medium/high)
  - Due date and overdue highlighting
  - Category (Study/Personal/Work)
- Search by task name
- Filters by status and category
- Dashboard stats (total/completed/pending)
- Quick notes section
- Dark mode with localStorage persistence

## Demo

![App Screenshot](screenshot.png)

Run the app locally, sign up, and start managing tasks and notes from the dashboard.

## Project Structure

```text
/studyhub
  /frontend
    /html-css-js
    /react-app
  /backend
  /database
```

## 1) Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd ../frontend/react-app
npm install
```

## 2) Setup MySQL

1. Create DB and tables:
```bash
mysql -u root -p < ../database/schema.sql
```
2. Confirm DB name is `studyhub`.

## 3) Configure Backend Env

In `/backend`, create `.env` from `.env.example`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=studyhub
JWT_SECRET=replace_with_a_strong_secret
FRONTEND_URL=http://localhost:5173
```

## 4) Run Backend

```bash
cd backend
npm run dev
```

Runs on: `http://localhost:5000`

## 5) Run Frontend

```bash
cd frontend/react-app
npm run dev
```

Runs on: `http://localhost:5173`

## 6) Deployment

This project can be deployed as two separate services:

- Backend: deploy the `backend` folder to any Node.js host such as Render, Railway, or Heroku.
- Frontend: deploy the `frontend/react-app` folder to Vercel, Netlify, or any static host.

Make sure to set these environment variables for the backend service:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `FRONTEND_URL` (the deployed frontend URL)

For the frontend, set `VITE_API_BASE_URL` to your deployed backend API URL, for example:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api
```

## App Flow

- Home page is public (`/`)
- `Get Started` / `Dashboard`:
  - Not logged in -> redirect to `/login`
  - Logged in -> open `/dashboard`
- Dashboard is protected route (JWT in `localStorage`)
- Logout clears token and redirects to login

## API Endpoints

- `POST /api/signup`
- `POST /api/login`
- `GET /api/tasks` (protected)
- `POST /api/tasks` (protected)  
  Body: `{ task_name, priority, due_date, category }`
- `PUT /api/tasks/:id` (protected)  
  Body (partial): `{ task_name, status, priority, due_date, category }`
- `DELETE /api/tasks/:id` (protected)
