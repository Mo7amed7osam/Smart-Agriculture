# Smart Agriculture – AI for Plant Diseases

This project contains a Node.js/Express backend and a React (Vite) frontend for uploading leaf images, sending them to an ML classifier (mocked by default), storing results in MongoDB, and viewing prediction history per user.

## Backend

```
cd backend
cp .env.example .env   # fill PORT, MONGODB_URI, JWT_SECRET, ML_SERVICE_URL
npm install
npm run dev            # http://localhost:5000
```

Endpoints:
- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/predictions` — `multipart/form-data` with `image`, requires `Authorization: Bearer <token>`
- `GET /api/predictions` — history for the logged-in user, requires token

If `ML_SERVICE_URL` is missing/unreachable, a mock prediction is returned.

## Frontend (Vite + React)

```
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Create `frontend/.env` with `VITE_API_URL=http://localhost:5000/api` if different. Login/register, upload a leaf image, view the prediction result and your history.
