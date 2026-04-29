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
    /react-app
      /frontend
        index.html
        login.html
        signup.html
        dashboard.html
        style.css
        script.js
        /assets
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
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=studyhub
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
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

This project is best deployed as three separate services:

- Frontend: `frontend/react-app` (Vite static build)
- Backend API: `backend` (Node.js + Express)
- Database: managed MySQL (Aiven MySQL recommended for lowest cost)

Recommended stack:

- Frontend on Vercel (Hobby)
- Backend on Render Web Service (Free or Starter)
- MySQL on Aiven (Free tier for small hobby usage)

### Frontend deployment (Vercel)

- Root directory: `frontend/react-app`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<your-backend-domain>/api`

### Backend deployment (Render Web Service)

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Ensure your app uses `process.env.PORT` (already configured)

Set these environment variables for the backend service:

- `DB_HOST` or `MYSQL_HOST`
- `DB_PORT` or `MYSQL_PORT`
- `DB_USER` or `MYSQL_USER`
- `DB_PASSWORD` or `MYSQL_PASSWORD`
- `DB_NAME` or `MYSQL_DATABASE`
- `DB_SSL` (`true` for most managed cloud MySQL services)
- `DB_SSL_REJECT_UNAUTHORIZED` (`true` by default, can be `false` if provider requires)
- `JWT_SECRET`
- `FRONTEND_URL` (deployed frontend URL; supports comma-separated list)

### Backend deployment (Railway)

- Service root: `backend`
- Start command: `npm start`
- Railway MySQL connection values are supported via either individual vars or a single URL.

Set these environment variables for Railway:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `JWT_SECRET`
- `FRONTEND_URL`

Railway also supports `DATABASE_URL` / `MYSQL_URL` / `JAWSDB_URL`; the backend now parses those connection strings automatically.

### Database deployment (Aiven MySQL)

1. Create a MySQL service in Aiven.
2. Copy connection details (`host`, `port`, `user`, `password`, `database`).
3. Set backend env variables using those values.
4. Set `DB_SSL=true` for cloud connection.
5. Deploy backend; tables are auto-initialized on startup.

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
