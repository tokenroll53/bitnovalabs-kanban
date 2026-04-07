# Bitnova Kanban: Safe-Launch Priority Plan

## Summary
This plan assumes the app remains an internal shared board deployed on GitHub Pages. The goal is to make it safe to launch this week with minimal product risk. Work should be sequenced in this order: close security and documentation mismatches, validate deployment assumptions, run release verification, then schedule maintainability work for immediately after launch.

## Prioritized Actions

### P0 - Close launch blockers
- Add explicit clickjacking protection to the CSP in `index.html` with `frame-ancestors 'none'`, unless embedding is intentionally allowed and documented.
- Verify the Firestore rules from `firestore.rules` are actually deployed to the live Firebase project.
- Reconcile `docs/CODE_REVIEW.md` and `docs/SECURITY_CHECKLIST.md` with the real code so they do not claim protections that are not present.
- Treat this group as required before release.

### P1 - Fix deployment and onboarding reliability
- Update `docs/INSTALLATION_GUIDE.md` so setup steps reflect the current app and remove stale references such as `seedDemoData()`.
- Keep GitHub Pages as the supported host for this release and verify `manifest.json` `start_url` and `sw.js` `BASE` match the exact deployed subpath.
- Add one concise deployment checklist covering: authorized domain, Firestore rules published, Google auth enabled, and PWA path validation.
- Make this the canonical onboarding path for future deploys.

### P1 - Run a release verification pass
- Verify Google login on desktop popup flow and mobile redirect flow.
- Verify create, edit, drag/drop, archive, restore, and export actions against Firestore.
- Verify offline persistence, reconnect sync, and realtime updates across two browser sessions.
- Run one XSS regression test using HTML payloads in user-entered fields and confirm the payload renders as text.
- Verify installability and offline fallback from the GitHub Pages URL.

### P2 - Reduce near-term operational risk
- Improve user-visible error states for sync/auth failures so production issues are diagnosable without reading code.
- Record current accepted limitations for internal users: shared board access, no fine-grained roles, GitHub Pages subpath dependency, and single-file architecture.
- Keep inline handlers and the current CSP tradeoff for this week if speed matters, but capture their removal as a post-launch hardening item.

### P3 - Post-launch maintainability
- Split the current single-file app into separate HTML, CSS, and JS modules without changing behavior.
- Extract Firebase config and deployment-path constants into a single config location.
- Replace inline event handlers with bound listeners so CSP can be tightened later.
- Add lightweight automated smoke coverage for auth gating, board rendering, and Firestore-backed core flows.

## Implementation Notes
- Hosting model stays GitHub Pages for this release.
- Access model stays as one internal shared board for authenticated users.
- No product-scope expansion should happen before the P0 and P1 items are complete.
- Post-launch refactor work should preserve existing behavior and deployment shape unless a separate plan replaces it.

## Test Cases
- Authorized users can sign in; unauthorized-domain failures show a clear message.
- Unauthenticated Firestore access is denied; authenticated access succeeds.
- Card CRUD, drag/drop, archive, and restore persist after refresh.
- Export produces a usable JSON snapshot.
- Offline edits sync after reconnect.
- Realtime updates appear in another tab or browser session.
- HTML payloads in title, description, and checklist fields are rendered as escaped text.
- PWA install and offline entry work from the GitHub Pages subpath.

## Assumptions And Defaults
- The audience for this plan is you and your IDE agents, so the roadmap is written for direct implementation.
- The current goal is a safe internal launch this week, not a rewrite.
- GitHub Pages remains the deployment target for now.
- The board remains a shared internal workspace, not a role-based app.
- Recommended default: do not refactor architecture before launch; harden release safety first, then restructure immediately after launch.
