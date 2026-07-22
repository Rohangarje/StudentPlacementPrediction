# Google Authentication Implementation Plan ✅

## Backend Tasks
- [x] Add `google-auth` and `PyJWT` to requirements.txt
- [x] Create `backend/app/services/auth_service.py` — Google token verification & JWT generation
- [x] Create `backend/app/api/auth_routes.py` — POST /auth/google endpoint
- [x] Register auth router in `backend/main.py`
- [x] Add `python-dotenv` for .env file loading

## Frontend Tasks
- [x] Install `@react-oauth/google` package
- [x] Create `frontend/src/context/AuthContext.jsx` — Auth state management
- [x] Modify `frontend/src/main.jsx` — Wrap app with GoogleOAuthProvider + AuthProvider
- [x] Create `frontend/src/components/LoginModal.jsx` — Login prompt modal
- [x] Modify `frontend/src/pages/Prediction.jsx` — Gate predict button behind auth + show auth status
- [x] Add Google sign-in button and user avatar dropdown in Navbar component
- [x] Create `.env.example` files for both frontend and backend
- [x] Install backend dependencies (google-auth, PyJWT, python-dotenv)

## Configuration Required
1. Create a Google OAuth Client ID at https://console.cloud.google.com/apis/credentials
2. Copy `frontend/.env.example` → `frontend/.env` and set `VITE_GOOGLE_CLIENT_ID`
3. Copy `backend/.env.example` → `backend/.env` and set `GOOGLE_CLIENT_ID`

