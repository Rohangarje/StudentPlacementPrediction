# Google Authentication Implementation Plan

## Backend Tasks - ✅ Complete
- [x] Add `google-auth` and `PyJWT` to requirements.txt
- [x] Create `backend/app/services/auth_service.py` — Google token verification & JWT generation
- [x] Create `backend/app/api/auth_routes.py` — POST /auth/google endpoint
- [x] Register auth router in `backend/main.py`
- [x] All imports verified successfully

## Frontend Tasks - ✅ Complete
- [x] Install `@react-oauth/google` package
- [x] Create `frontend/src/context/AuthContext.jsx` — Auth state management
- [x] Modify `frontend/src/main.jsx` — Wrap app with GoogleOAuthProvider
- [x] Create `frontend/src/components/LoginModal.jsx` — Login prompt modal
- [x] Modify `frontend/src/pages/Prediction.jsx` — Gate predict button behind auth
- [x] Add Google login button in Navbar component
- [x] Frontend builds successfully (0 errors)

## Testing
- [ ] Start backend: `uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`
- [ ] Start frontend: `npm run dev`
- [ ] Set GOOGLE_CLIENT_ID in environment
