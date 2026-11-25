# Security Specification — 명동상품권 Firestore Rules

## 1. Data Invariants
1. **Public Read-Only Market Data**: `rates/{rateId}`, `posts/{postId}`, and `settings/store` are readable by all visitors for live rate lookup and blog guide browsing, but strictly writable only by verified administrators (`isAdmin()`).
2. **Strict PII Drop-Box Isolation**: `inquiries/{inquiryId}` contains customer PII (`customerName`, `contact`, `message`). Public visitors may only `create` a strictly validated inquiry with initial status `'접수대기'`, empty `adminMemo`, and server-verified timestamps (`request.time`). No non-admin user (authenticated or anonymous) may `get`, `list`, `update`, or `delete` any inquiry document.
3. **Verified Admin RBAC**: `isAdmin()` requires `request.auth != null`, `request.auth.token.email_verified == true`, and either the bootstrapped owner email (`roykang007@gmail.com`) or an existing `/admins/$(request.auth.uid)` record.
4. **Path ID & Payload Bounds**: Every single-document target checks `isValidId()` (`^[a-zA-Z0-9_-]+$`, max 128 chars), every string enforces explicit `.size()` bounds matching `firebase-blueprint.json`, and every write enforces exact key allowlists (`hasAll` + `hasOnly`).
5. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` must strictly equal `request.time`. On inquiry updates, customer-submitted fields and `createdAt` are immutable; only `status`, `adminMemo`, and `updatedAt` may change.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Shadow Field Injection on Rate Create**: Admin creates a rate with extra ghost field `isVerified: true` -> rejected by `hasOnly`.
2. **Unauthenticated Rate Mutation**: Anonymous user attempts to update `rates/lotte-dept-10` `buyRate` to `99.9` -> rejected by `isAdmin()`.
3. **Email Spoofing Attack**: Signed-in user with `email: "roykang007@gmail.com"` and `email_verified: false` attempts to list `inquiries` -> rejected by `email_verified == true`.
4. **PII Read Leak (Get)**: Non-admin signed-in user attempts `get` on `inquiries/inq-001` -> rejected by `isAdmin()`.
5. **PII Read Leak (List)**: Non-admin signed-in user attempts `list` on `inquiries` -> rejected by `isAdmin()`.
6. **Inquiry Status Forgery on Create**: Public user creates inquiry with `status: "입금완료"` -> rejected by `incoming().status == '접수대기'`.
7. **Admin Memo Injection on Create**: Public user creates inquiry with `adminMemo: "승인됨"` -> rejected by `incoming().adminMemo == ''`.
8. **Timestamp Forgery**: Client creates inquiry with forged past `createdAt` instead of `request.time` -> rejected by `incoming().createdAt == request.time`.
9. **Resource Poisoning (Oversized ID)**: Public user creates inquiry with 500-char document ID containing spaces/slashes -> rejected by `isValidId(inquiryId)`.
10. **Value Poisoning (Oversized Message)**: Public user submits inquiry with 5,000-character `message` string -> rejected by `data.message.size() <= 1000`.
11. **Immutable Field Tampering on Inquiry Update**: Admin update tries to alter customer's original `faceValue` or `createdAt` -> rejected by `affectedKeys().hasOnly(['status', 'adminMemo', 'updatedAt'])`.
12. **Self-Privilege Escalation**: Non-admin authenticated user attempts to create `/admins/{ownUid}` -> rejected by `allow create: if false`.
