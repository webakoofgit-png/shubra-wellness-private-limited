# Shri Shubhra Wellness — Frontend Prototype

## Goal
Build a single, mobile-first healthcare management prototype from the uploaded brief, using fictional demo data and clearly marking all simulated flows. Do not connect a production database, OTP, payments, Aadhaar checks, or real messaging.

## User experience
- Replace the placeholder home screen with a shared demo sign-in and a polished healthcare workspace.
- Include a clearly labeled demo-only role switcher for Patient, Health Worker, Sales Representative, and Super Admin; each role opens its own relevant dashboard and navigation.
- Use the supplied green-and-white brand palette, gold only for highlights, responsive desktop sidebar and mobile bottom navigation, and an English/Marathi/Hindi/Kannada language selector.
- Provide working in-app views and demo interactions for patient records and medicine browsing, worker patient registration/surveys/incentives, sales orders, and admin people/assignment/incentive/medicine/order management. Use fictional identities and never collect Aadhaar data.
- Label simulated OTP, order checkout, and demo data clearly; keep demo mutations in the active session rather than presenting them as permanent records.

## Technical approach
- Keep the prototype at `/` as one TanStack Start page with a reusable role-aware shell and focused view helpers; do not introduce backend services or route guards that imply production security.
- Define all app colors and typography in `src/styles.css` semantic tokens, then use existing design-system controls.
- Keep demo records and calculation/assignment rules in a browser-safe mock-data module, separate from the screen rendering. Add small tests for configurable incentive calculation and single-primary-worker reassignment history.
- Add unique home-page metadata and record the single-route, mock-service architecture decision in `AGENTS.md`.

## Acceptance
- `/` no longer renders the template placeholder; each demo role is reachable from the sign-in and the UI adapts cleanly to phone and desktop widths.
- Core navigation and the survey, registration, assignment, incentive, medicine, and order demo actions respond with visible updated state or confirmation.
- No real auth, persistence, payment, SMS, medical claims, or backend is represented as active; tests and preview build checks pass.
