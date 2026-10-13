# Android readiness

Phase 1 is one responsive TanStack Start application, not four Android applications. The mobile shell has touch-sized controls, safe-area spacing, bottom navigation, adaptive forms, Unicode language support and browser-history-backed screen navigation.

`public/manifest.webmanifest` defines standalone display intent and branding. It does not claim an offline PWA, Android binary or Play Store publication. No service worker caches sensitive records.

## Future Capacitor integration

1. Choose the production API/session design first. Frontend local storage must not become the permanent patient database.
2. Produce a client-only/static shell build for Capacitor. The current default TanStack build includes a server/Cloudflare output and must not be copied wholesale into Android assets. Audit the static export or dedicated client-shell build while preserving this single React application.
3. Add Capacitor core/CLI/Android dependencies and configure the audited static output directory as `webDir`. Do not point it at the current server output. Package all four roles in the same app.
4. Generate Android app icons, splash resources and package ID after brand approval. The current SVG icon is a web placeholder.
5. Use Capacitor App's back-button event to navigate browser history for a nested screen and confirm exit at the root. The Phase 1 screen URLs already use history and hashchange/popstate handling. Dismiss dialogs before leaving a screen.
6. Validate deep links/referral tokens, clipboard support, external payment handoffs, accessibility, Unicode fonts, small screens and session expiry on a real Android device.
7. Implement verified OTP/MFA, centralized restoration, identity-reviewed recovery, server-side authorization, privacy notices and legally reviewed data retention before collecting real patient information.
8. Complete signing, Android permission review, Play Store data-safety disclosures and testing before publication.

No APK, native bridge, push-notification provider or store deployment is included in this frontend phase. Use the existing Node/Express/MySQL contracts for later backend integration.
