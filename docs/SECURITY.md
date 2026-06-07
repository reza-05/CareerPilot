# Security Notes

This document summarizes the security controls added for CareerPilot and maps them to common OWASP risks.

## Authentication and Access Control

- Firebase Auth provides Google and email/password authentication.
- Firestore rules should be user-scoped by Firebase UID.
- Backend can verify Firebase ID tokens when `REQUIRE_FIREBASE_AUTH=true`.
- Frontend sends Firebase Bearer tokens for protected API requests.

Recommended production setting:

```env
REQUIRE_FIREBASE_AUTH=true
```

## Injection Protection

- Backend database operations use SQLAlchemy ORM patterns.
- User input is validated and bounded before search/AI/database operations.
- Avoid direct SQL string concatenation with user input.

## XSS Protection

- React escapes normal rendered text by default.
- User-submitted text is sanitized before backend processing.
- Avoid `dangerouslySetInnerHTML`.
- Security headers include `X-Content-Type-Options`, `X-Frame-Options`, and restrictive permissions policy.

## Secret Management

- API keys are loaded through environment variables.
- `.env` and `.env.local` should remain private.
- Firebase frontend public keys are allowed to be public, but backend service credentials must never be committed.

## Safe File Uploads

- Uploads are restricted to expected CV document types.
- File names are normalized.
- File size limits should be enforced.
- Uploaded content is processed as data, not executed.

## Error Handling

- Public API responses should use generic user-facing errors.
- Stack traces, local paths, raw provider errors, and database internals should stay in server logs only.

## Dependency Safety

- Frontend uses a PostCSS override for a patched secure version.
- Run `npm audit` before submission.
- Use Python 3.11+ for deployment to avoid Python 3.9 end-of-life warnings.

## Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /careerpilot_users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Production Hardening Checklist

- Enable HTTPS everywhere.
- Rotate API keys after public demos.
- Set strict `ALLOWED_ORIGINS`.
- Enable Firebase backend verification.
- Move SQLite to Postgres for multi-user production scale.
- Store uploaded files in Firebase Storage/S3 with authenticated rules.
- Add rate limiting on AI and search endpoints.
- Add monitoring for provider failures and latency.
