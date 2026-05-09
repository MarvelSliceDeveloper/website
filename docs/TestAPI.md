# TestAPI: Postman / Insomnia Testing Guide

This guide explains how to set up an API testing environment (like Postman or Insomnia) to test the LMS platform endpoints without needing a custom frontend.

## 1. Environment Setup
To test effectively, you should create a new **Environment** in Postman and define the following variables. This allows you to chain requests without manually copying and pasting IDs.

| Variable | Description | Initial Value |
|---|---|---|
| `baseUrl` | The base URL of your API (e.g., `http://localhost:3000`). | `http://localhost:3000` |
| `accessToken` | The JWT token received from login. | *Leave blank initially* |
| `courseId` | A Course ID for creating sessions or getting recordings. | *Leave blank initially* |
| `moduleId` | A Module ID for scheduling sessions. | *Leave blank initially* |
| `sessionId` | A Session ID returned from the Create Session endpoint. | *Leave blank initially* |
| `recordingId` | A Recording ID returned from the List Recordings endpoint. | *Leave blank initially* |

---

## 2. Authentication Flow

Most endpoints are secured via JWT. You must authenticate first.

### Step 2.1: Register a Test User
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/register`
- **Body (JSON):**
  ```json
  {
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "Password123!"
  }
  ```

### Step 2.2: Login
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "testuser@example.com",
    "password": "Password123!"
  }
  ```
- **Action:** Copy the `accessToken` from the JSON response and save it as your `accessToken` environment variable.

---

## 3. Global Authorization Setup
For all the requests below, configure your Postman authorization settings:
- **Type:** Bearer Token
- **Token:** `{{accessToken}}`

---

## 4. Testing Calendar Endpoints

### Get Calendar Events
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/calendar/events?start=2026-05-01T00:00:00.000Z&end=2026-06-01T00:00:00.000Z`
- *Note:* Adjust dates to fall within your testing timeframe.

### Get Live Sessions (Currently Active)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/calendar/live`

---

## 5. Testing Live Sessions Endpoints
*(Requires `courseId` and `moduleId` to be set in your environment if you already have them in your DB)*

### Create Session
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/sessions`
- **Body (JSON):**
  ```json
  {
    "courseId": "{{courseId}}",
    "moduleId": "{{moduleId}}",
    "title": "Postman Test Session",
    "startDateTime": "2026-05-15T10:00:00.000Z",
    "endDateTime": "2026-05-15T11:00:00.000Z"
  }
  ```
- **Action:** When this returns a 201 Created, copy `session.id` to your `sessionId` environment variable.

### Get Session Details
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/sessions/{{sessionId}}`

### Cancel Session
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/sessions/{{sessionId}}`

---

## 6. Testing Recordings Endpoints
*(These endpoints return data only if your session has synced recordings)*

### List Course Recordings
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/recordings?courseId={{courseId}}`
- **Action:** Copy `recordings[0].id` to your `recordingId` environment variable.

### Get Playback URL
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/recordings/{{recordingId}}/url`

### Update Watch Progress
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/recordings/progress`
- **Body (JSON):**
  ```json
  {
    "recordingId": "{{recordingId}}",
    "watchedSeconds": 60
  }
  ```

---

## Important Note on Microsoft Graph
Standard authentication (Step 2) works locally. However, if your test user isn't linked to a Microsoft Account, hitting endpoints that interact directly with Azure (like `POST /api/calendar/sync` or creating MS Teams sessions via `POST /api/sessions`) will return authorization errors. To test those, you must go through the frontend OAuth flow first to link the account.
