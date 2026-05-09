# Phase 9 — Payments (Razorpay)

> ⏱️ **Duration**: Weeks 16–17 (2 weeks)  
> 📌 **Status**: Not Started  
> 🔗 **Depends on**: Phase 8  
> ⚠️ **Extended from original 1 week → 2 weeks** (3 monetisation models + webhook verification + edge cases)

---

## 🎯 Objective

Integrate Razorpay for course payments supporting one-time purchase, monthly subscription, and freemium models. Auto-enroll students on successful payment.

---

## ✅ Tasks

### 9.1 — Razorpay Setup

- [ ] Create Razorpay account (or use test mode)
- [ ] Configure environment variables:
  ```env
  RAZORPAY_KEY_ID=rzp_test_...
  RAZORPAY_KEY_SECRET=...
  RAZORPAY_WEBHOOK_SECRET=...
  ```
- [ ] Install Razorpay Node.js SDK: `razorpay`
- [ ] Create `PaymentService` module:
  - Initialize Razorpay instance with credentials
  - Helper functions for order creation, verification, refund

### 9.2 — One-Time Purchase Flow

- [ ] Backend:
  - `POST /api/payments/create-order` — create Razorpay order
    ```json
    {
      "courseId": "...",
      "amount": 999,      // in INR (smallest unit: paise)
      "currency": "INR"
    }
    ```
  - Creates `Payment` record with status `created`
  - Returns `razorpayOrderId` + `amount` + `key_id` to frontend
- [ ] Frontend:
  - Load Razorpay checkout script
  - Open Razorpay checkout widget with order details
  - On success callback: send `razorpayPaymentId` + `razorpaySignature` to backend
  - On failure: show error message, allow retry
- [ ] Backend verification:
  - `POST /api/payments/verify`
  - Verify HMAC-SHA256 signature:
    ```
    generated_signature = HMAC_SHA256(razorpayOrderId + "|" + razorpayPaymentId, webhook_secret)
    ```
  - If valid: update `Payment` status to `paid`, create `Enrollment`
  - If invalid: update status to `failed`, return error
- [ ] **🆕 Idempotency**: If payment already verified, don't create duplicate enrollment

### 9.3 — Razorpay Webhook Handler

- [ ] Create webhook endpoint: `POST /api/webhooks/razorpay`
  - Verify webhook signature (HMAC-SHA256 with webhook secret)
  - Handle events:
    - `payment.captured` — payment successful, enroll student
    - `payment.failed` — mark payment as failed
    - `order.paid` — alternate success event
    - `refund.created` — handle refund (see 9.6)
    - `subscription.activated` — subscription started (see 9.4)
    - `subscription.charged` — recurring payment successful
    - `subscription.cancelled` — subscription ended
- [ ] **🆕 Webhook reliability**:
  - Process webhooks asynchronously via Bull queue
  - Idempotent processing (check if already processed by `razorpayPaymentId`)
  - Store raw webhook payload for audit/debugging
  - Return 200 immediately, process in background
  - Retry failed webhook processing (max 3 retries)
  - Dead-letter queue for failed webhooks

### 9.4 — Subscription Model (Monthly)

- [ ] Create Razorpay Plan: `POST /plans` via Razorpay Dashboard or API
  - Define plan: name, amount, period (monthly), interval
- [ ] Backend:
  - `POST /api/payments/subscribe` — create Razorpay Subscription
  - Returns `subscription_id` to frontend
  - Frontend opens Razorpay widget in subscription mode
- [ ] Subscription lifecycle:
  - `subscription.activated` → create enrollment, store `subscriptionId`
  - `subscription.charged` → extend enrollment period
  - `subscription.cancelled` → revoke access after current period ends
  - `subscription.paused` → pause access
- [ ] **🆕 Subscription management page**:
  - Student can view active subscriptions
  - Cancel subscription (effective end of billing period)
  - View payment history

### 9.5 — Freemium Model

- [ ] If `course.price === 0`:
  - Skip payment flow entirely
  - Directly create `Enrollment` on "Enroll" click
  - No Razorpay involvement
- [ ] Frontend: Show "Enroll for Free" button instead of price

### 9.6 — 🆕 Refund Handling

- [ ] Create refund API: `POST /api/payments/:id/refund` (admin only)
  - Call Razorpay refund API
  - Update payment status to `refunded`
  - Revoke enrollment
  - Send refund confirmation email to student
- [ ] Create refund policy page
- [ ] Allow partial refunds (configurable by admin)
- [ ] Refund window: configurable per course (e.g., 7 days)

### 9.7 — 🆕 Revenue Analytics

- [ ] Create revenue API endpoints (admin only):
  - `GET /api/admin/revenue` — total revenue, this month, growth
  - `GET /api/admin/revenue/by-course` — revenue breakdown per course
  - `GET /api/admin/revenue/by-month` — monthly trend
- [ ] Dashboard widgets:
  - Total revenue (all time)
  - Revenue this month vs last month
  - Top earning courses
  - Payment success/failure rate

### 9.8 — 🆕 Invoice Generation

- [ ] Generate PDF invoice on successful payment:
  - Student name, course name, amount, payment ID, date
  - platform's GST number (if configured)
  - Download link in payment confirmation email
- [ ] Store invoices on cloud storage (S3/R2)
- [ ] Invoice accessible from student's payment history

### 9.9 — Payment Pages (Frontend)

- [ ] Payment confirmation page:
  - Success: "Payment successful! You're enrolled in [Course Name]"
  - Failure: "Payment failed. Please try again." with retry button
- [ ] Payment history page (student):
  - List all payments with status, date, amount, course
  - Download invoice button
- [ ] **🆕 Coupon/Discount codes** (optional, future):
  - Create `Coupon` table: code, discountPercent, maxUses, expiresAt
  - Apply coupon on checkout → reduce order amount
  - Validate: not expired, not max uses reached, not already used by this user

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| One-time purchase flow | Student pays → gets enrolled |
| Razorpay webhook handler | Webhook processes payment events |
| Subscription model | Student subscribes, charged monthly |
| Freemium model | Free courses auto-enroll on click |
| Payment verification | HMAC signature verified on all payments |
| Refund handling | Admin can refund, enrollment revoked |
| Revenue analytics | Admin sees revenue dashboard |
| Invoice generation | PDF invoice generated on payment |
| Payment history | Student sees all past payments |

---

## 🧪 Tests to Write

- [ ] Unit: HMAC signature verification (valid and invalid cases)
- [ ] Unit: Payment status transitions (created → paid → refunded)
- [ ] Unit: Freemium enrollment skips payment
- [ ] Integration: Order creation returns valid Razorpay order
- [ ] Integration: Webhook processes payment.captured and creates enrollment
- [ ] Integration: Duplicate webhook doesn't create duplicate enrollment
- [ ] Integration: Refund revokes enrollment
- [ ] Integration: Subscription lifecycle (activate → charge → cancel)
- [ ] E2E: Student selects paid course → pays → enrolled → sees course
- [ ] E2E: Student enrolls in free course → immediately enrolled

---

## ⚠️ Important Security Notes

> [!CAUTION]
> - **NEVER trust client-side payment verification**. Always verify via webhook OR server-side signature check.
> - **Webhook secrets must be different** from API key secrets.
> - **Log all payment events** with full payload for audit trail.
> - **Test with Razorpay test mode** before going to production.
> - **PCI compliance**: Razorpay handles card data — never touch it yourself.

