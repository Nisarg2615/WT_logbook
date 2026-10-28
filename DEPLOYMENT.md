# eLogBook Deployment Guide

This guide details how to run eLogBook locally and deploy it to production today.

---

## 1. Quick Local Execution

### Backend (Terminal 1)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
# Seed the database (if not already seeded)
python seed.py
# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Documentation / Swagger: `http://localhost:8000/docs`

### Frontend (Terminal 2)
```powershell
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 2. Docker Deployment (Recommended - 1 Command)

With Docker and Docker Compose installed:
```bash
docker compose up --build -d
```
- Frontend will be available at: `http://localhost` (Port 80)
- Backend API will be available at: `http://localhost:8000` (Port 8000)

---

## 3. Cloud Deployment (Free / Fast Options)

### Option A: Render.com
1. **Backend (Web Service)**:
   - Root Directory: `backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt && python seed.py`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. **Frontend (Static Site)**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - In `frontend/src/api/client.ts`, set the backend URL to your Render service URL.

### Option B: Railway.app
- Deploy both services directly by connecting your repository. Railway automatically detects the `docker-compose.yml` or the Dockerfiles in `./backend` and `./frontend`.

### Option C: Vercel (Frontend) + Render/Railway (Backend)
- Deploy `frontend` to Vercel in 1 click by importing the repository and selecting the `frontend` directory (Vite framework preset).

---

## 4. Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Operator** | `operator@elogbook.com` | `password` |
| **Supervisor** | `supervisor@elogbook.com` | `password` |
| **Manager** | `manager@elogbook.com` | `password` |
