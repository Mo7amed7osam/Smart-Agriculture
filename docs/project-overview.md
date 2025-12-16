= Smart Agriculture – Project Overview

:toc:
:toclevels: 3

Overview of the system for plant disease detection and user-facing web app.

== Architecture

* Backend (Node.js/Express) under `backend/`: APIs for auth, predictions, uploads, MongoDB persistence, and ML orchestration.
* Frontend (React + Vite) under `frontend/`: SPA for registration, login, image upload, and viewing prediction history.
* Optional model service under `model_api/`: Flask + TensorFlow model that can be called by the backend (or deployed separately).
* Image assets are stored on disk under `backend/uploads` and served via `/uploads/...`.

== Backend (Node.js/Express)

* Entry: `backend/src/index.js` wires middleware (CORS, JSON, logging), static uploads, and routes `/api/auth` and `/api/predictions`. Connects to MongoDB via `src/config/db.js`.
* Auth: `src/controllers/authController.js`, `src/models/User.js`, `src/routes/authRoutes.js`, JWT via `JWT_SECRET`, password hashing with bcrypt.
* Predictions: `src/controllers/predictionController.js`, `src/models/Prediction.js`, `src/routes/predictionRoutes.js`.
** Uploads handled by `src/middleware/uploadMiddleware.js` (multer to `backend/uploads`), protected by `src/middleware/authMiddleware.js` (Bearer JWT).
** After upload, calls `src/services/mlService.js` to obtain health/disease/confidence/recommendation, stores record in MongoDB, and returns it.
* ML integration (`mlService.js`):
** Primary: HTTP plant disease API at `PLANT_DISEASE_API_URL` (default: hosted Railway endpoint).
** Fallbacks: Google Gemini via `GEMINI_API_KEY` (model names configurable) and optional generic HTTP service via `ML_SERVICE_URL`.
** Dev fallback: if `ALLOW_FALLBACK=true`, returns a randomized mock prediction when real services fail.
* Scripts: `npm run dev` (nodemon) / `npm start` (same).

=== Backend environment variables

* `PORT` (default 5000)
* `MONGODB_URI` (required)
* `JWT_SECRET` (required)
* `PLANT_DISEASE_API_URL` (optional; primary ML endpoint)
* `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_MODEL_FALLBACK`, `GEMINI_TEXT_MODE`, `GEMINI_TEXT_QUERY` (optional; Gemini path)
* `ML_SERVICE_URL` (optional; generic ML HTTP service)
* `ALLOW_FALLBACK` (`true` to enable mock predictions)

== Frontend (React + Vite)

* Entry/router: `frontend/src/App.jsx` with routes `/login`, `/register`, `/upload`, `/history`. Protected routes use `components/ProtectedRoute.jsx` + `components/Navbar.jsx`.
* Auth context: `src/context/AuthContext.jsx` stores user/token in `localStorage` and configures axios headers via `src/api/axiosClient.js`.
* Pages: `pages/LoginPage.jsx`, `RegisterPage.jsx`, `UploadPage.jsx` (image upload + live result UI), `HistoryPage.jsx` (prediction history list).
* UI pieces: `components/PredictionCard.jsx`, global styles in `src/styles.css`.
* Axios base URL: `VITE_API_URL` env (default `http://localhost:5000/api`).
* Scripts: `npm run dev` (Vite), `npm run build`, `npm run preview`.

=== Frontend environment variables

* `VITE_API_URL` (e.g., `http://localhost:5000/api` or your deployed backend URL)

== Optional model API (Flask)

* Located in `model_api/`. `app.py` loads `plant_disease_model.h5`, exposes `POST /predict` accepting `file`, returns `predicted_class`, `recommended_action`, `confidence_score`.
* Can be containerized via `model_api/Dockerfile`; dependencies in `requirements.txt`.
* Backend can point to it by setting `PLANT_DISEASE_API_URL`.

== Data flow

1. User registers/logs in; receives JWT.
2. Authenticated user uploads an image from frontend `/upload`.
3. Backend saves file to `backend/uploads/`, calls ML service(s), computes health/disease/confidence/recommendation, stores a `Prediction` document linked to the user.
4. Frontend displays immediate result and can fetch `/history` to show past predictions. Uploaded images are served at `/uploads/<filename>`.

== Local development

Backend:
----
cd backend
npm install
cp .env.example .env   # fill required vars
npm run dev            # http://localhost:5000
----

Frontend:
----
cd frontend
npm install
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev            # http://localhost:5173
----

Optional Flask model:
----
cd model_api
pip install -r requirements.txt
python app.py         # serves on 0.0.0.0:5000 by default
----

== CI/CD

* CI: `.github/workflows/ci.yml` runs frontend build and backend install on pushes/PRs to `main`.
* Deploy backend to Render: `.github/workflows/deploy-backend.yml` triggers Render deploy via `RENDER_DEPLOY_HOOK` secret; logs HTTP status/body in the Actions run.

== Quick references

* Backend API (requires JWT where noted):
** `POST /api/auth/register` — `{ name, email, password }`
** `POST /api/auth/login` — `{ email, password }`
** `POST /api/predictions` — multipart `image`, auth required
** `GET /api/predictions` — history for the authenticated user
* Static uploads: `/uploads/<filename>`
