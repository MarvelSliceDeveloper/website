# Phase 2 — Authentication

> ⏱️ **Duration**: Weeks 2–4 (3 weeks)  
> 📌 **Status**: Not Started  
> 🔗 **Depends on**: Phase 1  
> ⚠️ **Extended from original 2 weeks → 3 weeks** (MS OAuth + token encryption + role middleware is significant)

---

## 🎯 Objective

Implement a complete authentication system supporting both email/password and Microsoft OAuth login, with encrypted token storage, role-based access control, and automatic token refresh.

---

## ✅ Tasks

### 2.1 — Email/Password Authentication

- [ ] Create registration endpoint: `POST /api/auth/register`
  - Accept: name, email, password, tenantSlug
  - Validate with Zod schemas
  - Hash password with **bcrypt** (salt rounds: 12)
  - Check for duplicate email within tenant
  - Create User record in database
  - Return JWT token
- [ ] Create login endpoint: `POST /api/auth/login`
  - Validate credentials against bcrypt hash
  - Issue JWT (include: userId, tenantId, role)
  - Set HTTP-only secure cookie + return token in response body
- [ ] Create logout endpoint: `POST /api/auth/logout`
  - Clear HTTP-only cookie
  - Optionally: add token to Redis blacklist (for immediate revocation)
- [ ] Create password reset flow:
  - `POST /api/auth/forgot-password` — generate reset token, send email
  - `POST /api/auth/reset-password` — validate token, update password
- [ ] **🆕 Input validation & sanitization**:
  - Email format validation
  - Password strength requirements (min 8 chars, 1 uppercase, 1 number)
  - XSS protection on name field

### 2.2 — JWT Token System

- [ ] Implement JWT issuance with the following payload:
  ```typescript
  {
    userId: string;
    tenantId: string;
    role: UserRole;
    email: string;
    iat: number;
    exp: number;
  }
  ```
- [ ] Set token expiry: **Access token = 15 minutes**, **Refresh token = 7 days**
- [ ] Create `POST /api/auth/refresh` endpoint for token refresh
- [ ] Store refresh tokens in database or Redis with expiry
- [ ] Implement refresh token rotation (invalidate old on use)

### 2.3 — Authentication Middleware

- [ ] Create `authMiddleware` — validates JWT from Authorization header or cookie
  - Extract token → verify signature → attach `req.user`
  - Return 401 on missing/invalid/expired token
- [ ] Create `requireRole(roles: UserRole[])` middleware
  - Check `req.user.role` against allowed roles
  - Return 403 on insufficient permissions
- [ ] Create `tenantMiddleware` — extract tenant from URL/header, verify user belongs to tenant
- [ ] **🆕 Create CSRF protection middleware** for state-changing requests
- [ ] **🆕 Create rate limiting per-route** (e.g., 5 login attempts per 15 min per IP)

### 2.4 — Microsoft OAuth via MSAL.js + NextAuth

- [ ] Install and configure **NextAuth.js** in the Next.js app
  - Configure Microsoft Azure AD provider
  - Set up callback URL: `/api/auth/callback/azure-ad`
- [ ] Install and configure **MSAL.js** for browser-side auth
  - Configure `PublicClientApplication` with Azure AD credentials
  - Implement popup-based auth flow
- [ ] OAuth flow:
  1. User clicks "Sign in with Microsoft"
  2. MSAL.js opens popup → user authenticates with MS
  3. MS returns auth code to callback URL
  4. NextAuth exchanges code for `access_token` + `refresh_token`
  5. Backend stores tokens (encrypted — see 2.5)
  6. Backend issues own JWT for all subsequent API calls
- [ ] Handle first-time MS user:
  - Create User record with `msUserId`
  - Prompt to select/confirm tenant
- [ ] Handle existing user linking MS account:
  - `POST /api/auth/link-microsoft` — link MS identity to existing account
- [ ] Create `/ms-callback` page for handling the OAuth redirect

### 2.5 — Token Encryption (MS Tokens)

- [ ] Implement **AES-256-GCM** encryption for storing MS access/refresh tokens
  - Encryption key from `TOKEN_ENCRYPTION_KEY` env var
  - Store encrypted value + IV + auth tag in database
- [ ] Create utility functions:
  - `encryptToken(plaintext: string): EncryptedData`
  - `decryptToken(encrypted: EncryptedData): string`
- [ ] Never log or expose raw MS tokens in error messages or responses
- [ ] **🆕 Key rotation strategy**: Document how to rotate the encryption key without losing existing tokens

### 2.6 — Token Refresh Background Job

- [ ] Create Bull job: `tokenRefresh.job.ts`
  - Runs every 30 minutes
  - Queries users with MS tokens expiring within the next hour
  - Uses refresh token to obtain new access token from MS
  - Updates encrypted tokens in database
  - Logs failures (do not retry indefinitely — alert after 3 failures)
- [ ] Handle expired refresh tokens:
  - Mark user's MS integration as disconnected
  - Prompt user to re-authenticate on next login

### 2.7 — Frontend Auth Pages

- [ ] **Login page** (`/login`)
  - Email + password form
  - "Sign in with Microsoft" button
  - "Forgot password?" link
  - Redirect to dashboard on success
- [ ] **Registration page** (`/register`)
  - Name, email, password, confirm password
  - Tenant selection (dropdown or slug input)
  - "Sign up with Microsoft" option
  - Email verification notice after submission
- [ ] **MS Callback page** (`/ms-callback`)
  - Loading state while tokens are exchanged
  - Error display if auth fails
  - Redirect to dashboard on success
- [ ] **🆕 Email verification flow**:
  - Send verification email on registration
  - `GET /api/auth/verify-email?token=...` — verify token, activate account
  - Resend verification option

### 2.8 — 🆕 Security Hardening (Auth-Specific)

- [ ] Set HTTP security headers:
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy` (basic policy)
- [ ] Implement account lockout after 5 failed login attempts (15 min cooldown)
- [ ] Log all auth events (login, logout, failed attempt, password reset) with IP + user agent
- [ ] Ensure passwords are never logged or returned in API responses
- [ ] Add `Secure`, `HttpOnly`, `SameSite=Strict` flags to auth cookies

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Email/password registration + login | User can register and log in |
| Microsoft OAuth login | User can sign in with MS and gets redirected |
| JWT with refresh tokens | Token refreshes automatically before expiry |
| Role-based middleware | Unauthorized users get 403 |
| Encrypted MS tokens in DB | Tokens stored as encrypted blobs, not plaintext |
| Token refresh job | MS tokens refreshed before expiry |
| Auth pages (login, register, callback) | All pages render and function |
| Password reset flow | Email sent, password updated |
| CSRF protection | State-changing requests require valid CSRF token |
| Rate limiting on auth routes | 429 returned after threshold |

---

## 🧪 Tests to Write

- [ ] Unit: bcrypt hashing and comparison
- [ ] Unit: JWT issuance and verification
- [ ] Unit: Token encryption/decryption round-trip
- [ ] Unit: Role middleware rejects unauthorized roles
- [ ] Integration: Registration creates user in DB
- [ ] Integration: Login with correct credentials returns JWT
- [ ] Integration: Login with wrong password returns 401
- [ ] Integration: Refresh token rotation works correctly
- [ ] Integration: Rate limiter blocks after threshold
- [ ] E2E: Full registration → login → dashboard flow
- [ ] E2E: Microsoft OAuth flow (with MSW mock)

