# Plan: Snapshot Governance — Block Creator from Voting

## Problem

The user who creates a snapshot proposal can currently vote on it. This violates the governance purpose of the Snapshot section: proposals are meant to collect impartial votes from the team. The creator voting on their own proposal would bias results and undermine trust in the outcome.

The bug exists at two levels:
1. **UI**: `_buildDetailHTML` in `snapshot.js` renders voting inputs (VP tracker, allocation inputs, commit button) for all authenticated users including the creator. There is no `isCreator` check.
2. **Rules**: `firestore.rules` for `snapshots/{snapshotId}/votes/{userId}` only checks that the writer owns the vote document and is invited/admin. It does not verify that the writer is not the snapshot's creator. A user could bypass the UI and submit a vote via direct API call.

## Fix

### Layer 1 — Client-side (`js/snapshot.js`)

In `openSnapshotDetail`:
- After fetching `snap` and `user`, compute `const isCreator = user.email === snap.createdBy`
- Pass `isCreator` to `_buildDetailHTML`

In `_buildDetailHTML(snap, myVote, expired, isCreator)`:
- If `isCreator`: replace the VP tracker and options section with a creator-observer notice. The commit button is also omitted.
- The creator still sees: title, description, privacy badge, countdown timer (so they can monitor the vote in progress), and the results panel (public live results / encrypted placeholder / final results on expiry — same rules as other users).

**Creator observer notice copy:**
> "Eres el autor de esta propuesta. Los creadores no pueden votar para garantizar la imparcialidad del proceso."

### Layer 2 — Firestore rules (`firestore.rules`)

Add a creator check to the `votes/{userId}` write rule:

```
allow write: if request.auth != null
  && request.auth.uid == userId
  && (
    exists(/databases/$(database)/documents/invites/$(request.auth.token.email))
    || exists(/databases/$(database)/documents/admins/$(request.auth.token.email))
  )
  && get(/databases/$(database)/documents/snapshots/$(snapshotId)).data.createdBy
     != request.auth.token.email;
```

The `get(...)` call is a cross-document read inside the rule. Firestore allows this; it costs 1 additional read per vote write but that is negligible for a governance tool.

`createdBy` stores the creator's email (`user?.email`). The rule uses `request.auth.token.email` for the comparison — both are the same email identity, so the check is consistent.

## Files

| File | Change |
|------|--------|
| `js/snapshot.js` | Pass `isCreator` through `openSnapshotDetail` → `_buildDetailHTML`; render observer notice instead of voting UI when `isCreator` is true |
| `firestore.rules` | Add `get(...).data.createdBy != request.auth.token.email` to the votes write rule |

## Verification

1. Log in as User A. Create a snapshot. Open the detail overlay → voting inputs are absent; observer notice is visible; countdown and results panel are present.
2. Attempting a direct Firestore write to `snapshots/{id}/votes/{uid}` as the creator is rejected by the rules (403).
3. Log in as User B (not the creator). Open the same snapshot → full voting UI renders normally; User B can commit a vote.
4. After expiry, both users see the final results view with the verification stamp.
