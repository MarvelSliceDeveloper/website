# Meeting Provider Cost & Integration Comparison

**Last updated:** 2026-06-16  
**Purpose:** Compare Microsoft Teams (Graph API), Zoom, and Google Meet as meeting providers for the LMS. Covers license costs, API pricing, storage, and development effort.

---

## 1. Microsoft Teams (via Graph API) — Current Setup

### License Requirements

| Plan                                    | Price (per user/mo) | Participants | Meeting Limit | Cloud Storage   |
| --------------------------------------- | ------------------- | ------------ | ------------- | --------------- |
| **Teams Essentials** (standalone)       | $4.00               | 300          | 30 hrs        | 10 GB           |
| **M365 Business Basic** (with Teams)    | $6.00               | 300          | 30 hrs        | 1 TB (OneDrive) |
| **M365 Business Standard** (with Teams) | $12.50              | 300          | 30 hrs        | 1 TB (OneDrive) |
| **M365 Business Basic** (no Teams)      | $4.75               | —            | —             | 1 TB (OneDrive) |
| **M365 Business Standard** (no Teams)   | $10.25              | —            | —             | 1 TB (OneDrive) |

> Students/attendees **do not need a license** to join Teams meetings.

### API Costs

| API                                      | Cost     | Notes                                            |
| ---------------------------------------- | -------- | ------------------------------------------------ |
| `POST /me/onlineMeetings`                | **Free** | Create meeting                                   |
| `GET /me/onlineMeetings/{id}/recordings` | **Free** | Fetch recordings                                 |
| `GET /me/events`                         | **Free** | Calendar sync                                    |
| `POST /me/sendMail`                      | **Free** | Email notifications                              |
| All Microsoft Graph APIs                 | **Free** | As of Aug 2025, Teams APIs are no longer metered |

Only metered API (not used by LMS):

- `assignSensitivityLabel` — $0.00185/call (SharePoint)

### Recording Storage

- **Included:** 1 TB per user via SharePoint/OneDrive (Business Standard)
- **Included:** 10 GB (Teams Essentials standalone)
- **Additional:** None needed for typical LMS use (1 TB is sufficient)

### Development Status

| Feature          | Status           | Effort |
| ---------------- | ---------------- | ------ |
| Meeting creation | ✅ Already built | —      |
| Recording fetch  | ✅ Already built | —      |
| Calendar sync    | ✅ Already built | —      |
| Token refresh    | ✅ Already built | —      |

### Monthly Total (1 Admin)

| Scenario                      | Cost      |
| ----------------------------- | --------- |
| Teams Essentials (standalone) | $4.00/mo  |
| M365 Business Basic           | $6.00/mo  |
| M365 Business Standard        | $12.50/mo |

---

## 2. Zoom

### License Requirements

| Plan              | Price (per user/mo, annual) | Participants | Meeting Limit | Cloud Storage |
| ----------------- | --------------------------- | ------------ | ------------- | ------------- |
| **Basic** (free)  | $0                          | 100          | 40 min ❌     | Local only    |
| **Pro** ✅        | $13.33                      | 100          | 30 hrs        | 5–10 GB       |
| **Business**      | $18.33                      | 300          | 30 hrs        | 5–10 GB       |
| **Business Plus** | $22.49                      | 300          | 30 hrs        | 5–10 GB       |
| **Enterprise**    | Custom                      | 1,000        | 30 hrs        | Unlimited     |

> One Pro license is enough (admin hosts, students join free).

### API Costs

| API                        | Cost     | Notes                       |
| -------------------------- | -------- | --------------------------- |
| `POST /users/me/meetings`  | **Free** | Create meeting              |
| `GET /users/me/recordings` | **Free** | List recordings             |
| `GET /recordings/{id}`     | **Free** | Download recording          |
| Zoom REST API              | **Free** | Included with any paid plan |

### Recording Storage

| Storage                                                         | Cost                        | Notes                         |
| --------------------------------------------------------------- | --------------------------- | ----------------------------- |
| **Included**                                                    | 5–10 GB per license         | Fills up fast with recordings |
| **30 GB add-on**                                                | ~$10–15/mo                  | Covers ~30 hours of video     |
| **100 GB add-on**                                               | ~$40/mo                     | Covers ~100 hours             |
| **1 TB add-on**                                                 | ~$100/mo                    | Rarely needed                 |
| **Alternative:** Auto-download → delete from Zoom → store on S3 | **S3: ~$1.15/mo per 50 GB** | Cheapest long-term approach   |

### Development Effort

| Feature                       | Effort        | Notes                              |
| ----------------------------- | ------------- | ---------------------------------- |
| Meeting creation              | ~1 day        | Zoom API is straightforward        |
| Recording fetch + download    | ~1–2 days     | Pagination, webhook for completion |
| OAuth / Server-to-Server auth | ~0.5 day      | Zoom provides JWT or OAuth         |
| Provider abstraction layer    | ~1 day        | Interface + routing                |
| UI (provider selector)        | ~0.5 day      | Dropdown on session creation form  |
| **Total**                     | **~3–5 days** |                                    |

### Monthly Total (1 Admin)

| Scenario                                | Cost               |
| --------------------------------------- | ------------------ |
| Pro (annual billing, 1 host)            | $13.33/mo          |
| Pro + auto-sync to S3 (no Zoom storage) | $13.33/mo + ~$1 S3 |
| Pro + 30 GB Zoom storage                | ~$23–28/mo         |

---

## 3. Google Meet (via Google Workspace API)

### License Requirements

| Plan                     | Price (per user/mo, annual) | Participants | Meeting Limit | Cloud Storage |
| ------------------------ | --------------------------- | ------------ | ------------- | ------------- |
| **Business Starter**     | $7.00                       | 100          | 24 hrs        | 30 GB pooled  |
| **Business Standard** ✅ | $14.00                      | 150          | 24 hrs        | 2 TB pooled   |
| **Business Plus**        | $22.00                      | 500          | 24 hrs        | 5 TB pooled   |
| **Enterprise**           | Custom                      | 1,000        | 24 hrs        | Unlimited     |

### API Costs

| API                      | Cost                     | Notes                     |
| ------------------------ | ------------------------ | ------------------------- |
| `POST /meet/conferences` | **Free** (for now)       | Create meeting            |
| Meet Media API           | **Developer Preview**    | Not generally available   |
| **⚠️ Quota charges**     | **Coming later in 2026** | Pricing not yet announced |

> **Risk:** Google announced plans to charge for exceeding quota limits in 2026. No pricing details available yet.

### Recording Storage

- **Included:** 2 TB pooled storage (Business Standard) via Google Drive
- Recordings are automatically saved to Drive
- No separate recording storage cost

### Development Effort

| Feature                    | Effort        | Notes                                                    |
| -------------------------- | ------------- | -------------------------------------------------------- |
| Meeting creation           | ~1 day        | Google Calendar API                                      |
| Recording access           | ~2–3 days     | Meet recordings live in Drive — complex Drive API access |
| OAuth setup                | ~0.5 day      | Google Cloud OAuth                                       |
| Provider abstraction layer | ~1 day        |                                                          |
| UI (provider selector)     | ~0.5 day      |                                                          |
| **Total**                  | **~5–7 days** | Harder than Zoom due to Drive recording storage          |

### Monthly Total (1 Admin)

| Scenario                           | Cost               |
| ---------------------------------- | ------------------ |
| Business Standard (annual billing) | $14.00/mo          |
| + future API quota charges         | Unknown (TBD 2026) |

---

## 4. Side-by-Side Comparison

| Factor                     | **Teams (Graph API)** | **Zoom**         | **Google Meet**  |
| -------------------------- | --------------------- | ---------------- | ---------------- |
| **Min cost (1 admin)**     | **$4–6/mo**           | **$13.33/mo**    | **$14/mo**       |
| **API cost**               | ✅ Free               | ✅ Free          | ⚠️ Free for now  |
| **Meeting limit**          | 30 hrs                | 30 hrs           | 24 hrs           |
| **Participants**           | 300 (Essentials)      | 100 (Pro)        | 150 (Standard)   |
| **Recording storage**      | ✅ 1 TB free          | ⚠️ 5–10 GB only  | ✅ 2 TB free     |
| **Extra storage cost**     | $0 (1 TB enough)      | $10–40/mo extra  | $0 (2 TB enough) |
| **Recording auto-fetch**   | ✅ Already built      | 🔧 3–5 days dev  | 🔧 5–7 days dev  |
| **Calendar sync**          | ✅ Already built      | 🔧 Manual/custom | ⚠️ Partial       |
| **Meeting creation**       | ✅ Already built      | 🔧 3–5 days dev  | 🔧 5–7 days dev  |
| **Students need license?** | ❌ No                 | ❌ No            | ❌ No            |
| **Azure/cloud infra**      | $0 (free tier)        | $0               | $0               |

---

## 5. Recommendation

### Option A: Stick with Teams (Recommended)

| Aspect                   | Verdict                                 |
| ------------------------ | --------------------------------------- |
| **Cost**                 | ✅ Cheapest at $4–6/mo                  |
| **Feature completeness** | ✅ Everything already built             |
| **Recording storage**    | ✅ 1 TB free via SharePoint             |
| **Action needed**        | Buy 1x Teams Essentials license ($4/mo) |

### Option B: Switch to Zoom

| Aspect                   | Verdict                                |
| ------------------------ | -------------------------------------- |
| **Cost**                 | ⚠️ $13.33/mo — 2–3x Teams              |
| **Feature completeness** | 🔧 3–5 days development                |
| **Recording storage**    | ⚠️ 5 GB — need auto-download to S3     |
| **Best for**             | Teams where users strongly prefer Zoom |

### Option C: Switch to Google Meet

| Aspect                   | Verdict                                   |
| ------------------------ | ----------------------------------------- |
| **Cost**                 | ⚠️ $14/mo + unknown API charges coming    |
| **Feature completeness** | 🔧 5–7 days development (harder)          |
| **Recording storage**    | ✅ 2 TB free via Drive                    |
| **Best for**             | Organizations already on Google Workspace |

### Verdict

**Teams is the cheapest and most complete option.** The Graph API calls are all free, recording storage is 1 TB, and the entire integration is already built. The only blocker was the missing Teams license — one **Teams Essentials** license at **$4/user/month** resolves it.

---

## 6. Related Documents

- [MICROSOFT_GRAPH.md](./MICROSOFT_GRAPH.md) — Technical overview of current Graph integration
- [update/MICROSOFT_INTEGRATION_PLAN.md](./update/MICROSOFT_INTEGRATION_PLAN.md) — Full feature roadmap
- `apps/api/src/modules/graph/` — Graph module source code
