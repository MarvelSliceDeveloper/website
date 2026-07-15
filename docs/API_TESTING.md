# API Testing Guide

Quick way to test LMS API endpoints from the command line. No installation needed — `curl.exe` is built into Windows.

## Helper Script (recommended)

Use `scripts/api-test.ps1` — login once, then test everything with easy commands.

### Login once, test repeatedly

```powershell
# Login with key=value pairs
.\scripts\api-test.ps1 login admin email=admin@lms.local password=admin123
.\scripts\api-test.ps1 login student email=student@lms.local password=student123

# Log in as a named session (for multiple roles)
.\scripts\api-test.ps1 login admin email=admin@lms.local password=admin123 --as admin
.\scripts\api-test.ps1 login student email=student@lms.local password=student123 --as student
```

Sessions are stored in `%TEMP%\lms-api-sessions\` — login once per terminal session.

### Making requests

```powershell
# GET (default session: admin)
.\scripts\api-test.ps1 get /api/courses/enrolled

# GET as specific role
.\scripts\api-test.ps1 get /api/courses/enrolled --as student

# GET with query params (quote the URL so & doesn't break)
.\scripts\api-test.ps1 get "/api/admin/enrollments?status=PENDING" --as admin

# POST/PATCH with key=value body (auto-converted to JSON)
.\scripts\api-test.ps1 patch /api/admin/enrollments/abc/approve batchId=xyz
.\scripts\api-test.ps1 post /api/auth/login email=admin@lms.local password=admin123

# PATCH/DELETE with no body
.\scripts\api-test.ps1 patch /api/admin/enrollments/abc/reject --as admin
.\scripts\api-test.ps1 delete /api/enrollments/abc

# Verbose output (shows curl command)
.\scripts\api-test.ps1 get /health -v
```

### Quick reference

| Task | Command |
|------|---------|
| Check server health | `.\scripts\api-test.ps1 get /health` |
| Login | `.\scripts\api-test.ps1 login <role> email=... password=...` |
| Enrolled courses | `.\scripts\api-test.ps1 get /api/courses/enrolled --as student` |
| Course content | `.\scripts\api-test.ps1 get /api/courses/ID/content --as student` |
| Pending enrollments | `.\scripts\api-test.ps1 get "/api/admin/enrollments?status=PENDING"` |
| Approve enrollment | `.\scripts\api-test.ps1 patch /api/admin/enrollments/ID/approve batchId=ID` |
| Reject enrollment | `.\scripts\api-test.ps1 patch /api/admin/enrollments/ID/reject` |
| List batches | `.\scripts\api-test.ps1 get /api/admin/batches` |
| Batch details | `.\scripts\api-test.ps1 get /api/admin/batches/ID` |

## Using curl.exe directly

Avoid the PowerShell `curl` alias (which is `Invoke-WebRequest`) — use `curl.exe` explicitly:

```powershell
# Login — save cookies to file
curl.exe -s -S -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@lms.local\",\"password\":\"admin123\"}" ^
  --cookie-jar cookies.txt

# Use saved cookies for subsequent requests
curl.exe -s -S http://localhost:4000/health --cookie cookies.txt
curl.exe -s -S http://localhost:4000/api/courses/enrolled --cookie cookies.txt
```

## Key endpoints

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/health` | GET | any | Server health check |
| `/api/auth/login` | POST | any | Login (email, password) |
| `/api/auth/logout` | POST | any | Logout |
| `/api/auth/me` | GET | any | Current user info |
| `/api/courses/enrolled` | GET | student | Enrolled courses |
| `/api/courses/:id/content` | GET | student | Course content |
| `/api/courses/catalogue` | GET | any | Course catalogue |
| `/api/enrollments` | POST | student | Enroll in course |
| `/api/admin/enrollments` | GET | admin | List enrollments |
| `/api/admin/enrollments/:id/approve` | PATCH | admin | Approve enrollment |
| `/api/admin/enrollments/:id/reject` | PATCH | admin | Reject enrollment |
| `/api/admin/batches` | GET | admin | List batches |
| `/api/admin/batches/:id` | GET | admin | Batch details |
