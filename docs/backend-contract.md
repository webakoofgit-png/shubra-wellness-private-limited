# Future backend contract — design only

No production database or endpoint is created in Phase 1. Replace mock operations through the `WellnessApi` interface once Node.js/Express/MySQL and server-side authorization are implemented.

## Relational model

| Entity | Primary key and relationships | Required constraints |
| --- | --- | --- |
| users | id, role, normalized mobile, admin email, account status | Unique normalized mobile; approved role enum; password hash only for credential accounts |
| patients | immutable patient_id, unique user_id, DOB, address, registered_at, registration_reference_id | One profile per user; never regenerate ID on device reinstall |
| health_workers | worker_id, unique user_id, region, joined_at | Unique worker ID; valid staff registration |
| sales_representatives | representative_id, unique user_id | Unique representative ID |
| registration_references | id, unique token, worker_id FK, expiry, status | Server-signed/unpredictable reference; worker validity checked during registration |
| patient_assignments | patient_id unique FK, worker_id FK | Exactly one primary current worker; transactional admin-only changes |
| assignment_history | id, patient_id, from_worker_id, to_worker_id, reason, actor_user_id, timestamp | Append-only; required reason; immutable actor and timestamp |
| surveys | id, patient_id FK, worker_id FK, consent_record_id FK, structured answers, status | Consent required; server-scoped queries; encrypted medical content |
| consent_records | id, patient_id FK, scope, policy_version, collection_actor, collected_at | Record purpose and policy, revocation/retention behavior reviewed before launch |
| medicines | id, category_id FK, price DECIMAL, stock, ingredients, usage, status | Nonnegative stock/price; audited price/stock changes; no unverified cure claims |
| medicine_images | id, medicine_id FK, object reference, sort index | Validated image upload; no executable or private document content |
| orders | id, patient_id FK, representative_id nullable FK, delivery snapshot, amount, status | Idempotent creation; stock reservation transaction; permitted transitions |
| order_items | id, order_id FK, medicine_id FK, name/price/quantity snapshot | Positive integer quantity; retain snapshots if catalogue changes |
| payments | id, order_id FK, provider_reference unique, amount, method, status | Verified gateway webhook controls paid status; no raw card storage |
| incentive_rules | id, effective_at, rate DECIMAL, required_verification, required_survey, approval_required | Versioned policy; rates are administrator-controlled |
| incentives | id, patient_id UNIQUE FK, originating_worker_id FK, rule_id FK, amount snapshot, eligibility, approval | Database uniqueness prevents duplicate incentives; assignment changes do not duplicate or transfer earned rewards |
| incentive_payments | id, incentive_id FK, payment_reference, paid_at, actor_user_id | Paid only after approval; idempotent payout; audited reference |
| notifications | id, recipient_user_id FK, event, read_at | Recipient-scoped retrieval and updates |
| recovery_requests | id, patient_id FK, new_mobile, proof_reference, status, reviewer_id | Reviewed identity verification; uniqueness check; session revocation after mobile change |
| audit_logs | id, actor_user_id, action, subject, reason, server_timestamp | Append-only server-controlled audit log; minimum sensitive content |

Store dates/timestamps in UTC on the server and format them in the user's locale. Patient assignment and incentive creation must be atomic with verified registration. The server normalizes mobile numbers and resolves the existing account before considering any referral. Changing devices or reinstalling does not change user identity or attribution.

## API outline

| Method / endpoint | Behavior |
| --- | --- |
| POST /auth/otp/request | Rate-limit mobile challenges; do not disclose whether an account exists |
| POST /auth/otp/verify | Validate expiry/attempt limits; issue secure session; backend determines role |
| POST /auth/admin/login; POST /auth/mfa/verify | Credential verification and second-factor challenge |
| GET /me; PATCH /me | Return permitted profile fields; prevent patient ID/mobile/worker modifications |
| POST /patients/register | Requires verified challenge and valid reference; transactionally restore or create account |
| GET /patients; GET /patients/:id | Admin all; worker assigned only; sales customer contact projection only |
| POST /surveys; GET /surveys; PATCH /surveys/:id/review | Consent gate; patient/assigned-worker/admin medical scope |
| POST /patients/:id/reassign | Admin only; required reason; transaction writes current assignment and history |
| GET /medicines; POST/PATCH/DELETE /medicines/:id | Catalogue reads; admin-only management and upload validation |
| POST /orders; GET /orders; PATCH /orders/:id/status | Scope by patient/representative; authoritative prices, stock and totals |
| POST /payments/checkout; POST /payments/webhook | Future Razorpay integration; verified webhook and idempotency |
| GET /incentives; PATCH /incentive-rules | Worker own; admin rules; registration eligibility calculated server-side |
| POST /incentives/:id/approve /reject /pay | Admin role; validated transitions, payment reference and audit |
| GET /reports; GET /reports/export | Server-scoped filters; medical details excluded from sales exports |
| GET /notifications; PATCH /notifications/:id/read | Recipient-only updates |
| POST /recovery-requests; POST /recovery-requests/:id/review | Identity-reviewed recovery; never authorize a number change solely by old ID |
| POST /account/deletion-requests | Reviewed deletion/retention process; legal/privacy policy required before launch |

Authorization must be enforced independently on every endpoint, including export/detail endpoints. Use secure HttpOnly/SameSite sessions, CSRF protection where needed, input validation, minimum necessary projections, encrypted sensitive records, audit logs, idempotency keys, optimistic concurrency and restrictive CORS. Production credentials never belong in client bundles.

## Demo differences

The demo code 123456 and admin password are public examples, not secrets. Browser state cannot enforce real permissions or durable audit history. The recovery approval and incentive payment buttons simulate a review/ledger entry, not actual identity verification or bank transfer. Production OTP, MFA, database constraints, security, legal policies, payment reconciliation and cross-device restoration remain future implementation work.
