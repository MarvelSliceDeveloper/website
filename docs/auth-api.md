# Authentication API Documentation

This document outlines the REST API endpoints created during Phase 2 for the authentication module.

## Base URL
`/api/auth`

---

## 1. Register User
Creates a new user via email and password within a specific tenant.

**Endpoint:** `POST /register`  
**Auth Required:** No  

### Request Body (JSON)
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "tenantSlug": "default"
}
```

### Success Response (201 Created)
Returns tokens in the JSON response and sets an HTTP-only `accessToken` cookie.
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "userId": "uuid-1234",
    "tenantId": "uuid-5678",
    "role": "STUDENT",
    "email": "john@example.com"
  }
}
```

### Error Responses
- **400 Bad Request:** Validation errors (e.g., weak password, invalid email).
- **400 Bad Request:** "Email already registered in this tenant".

---

## 2. Login User
Authenticates a user and issues JWT tokens.

**Endpoint:** `POST /login`  
**Auth Required:** No  

### Request Body (JSON)
```json
{
  "email": "john@example.com",
  "password": "Password123!",
  "tenantSlug": "default"
}
```

### Success Response (200 OK)
Returns tokens in the JSON response and sets an HTTP-only `accessToken` cookie.
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "userId": "uuid-1234",
    "tenantId": "uuid-5678",
    "role": "STUDENT",
    "email": "john@example.com"
  }
}
```

### Error Responses
- **401 Unauthorized:** "Invalid credentials".

---

## 3. Logout User
Clears the HTTP-only access token cookie.

**Endpoint:** `POST /logout`  
**Auth Required:** No  

### Success Response (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

---

## Security Features Implemented

1. **Password Hashing**: Passwords are mathematically hashed using `bcryptjs` with 12 salt rounds before hitting the database.
2. **HTTP-Only Cookies**: JWTs are securely attached to cookies (`secure`, `samesite=strict`) so that frontend JS cannot be exploited to steal them.
3. **Role-Based Access Control**: `requireRole([UserRole.ADMIN])` middleware was created to effortlessly protect API endpoints.
4. **Tenant Isolation**: `requireTenant` middleware enforces that users can only interact with data matching the `tenantId` baked into their secure JWT.
5. **Token Encryption Module**: An `AES-256-GCM` encryption helper (`apps/api/src/utils/encryption.ts`) safely encrypts Microsoft Access/Refresh tokens before placing them into the Postgres DB.
