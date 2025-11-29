# Anonymous Uploads (opt-in)

This project supports an opt-in flag to allow anonymous (unauthenticated) file uploads.

Why this exists
- The repository uses a temporary mock authentication flow while Entra ID / Azure AD admin consent is pending.
- Some teams need to allow uploads for unauthenticated users temporarily to unblock workflows.

How it works
- Set the environment variable `ALLOW_ANONYMOUS_UPLOADS=true` in your Static Web App / deployment to enable this feature.
- When enabled, anonymous uploads are allowed only for the root folder (parentId === null). Uploads to any non-root folder will be rejected with HTTP 403.
- The feature only affects the upload endpoints:
  - `POST /api/files/upload-sas`
  - `POST /api/files/upload`
  - `POST /api/files/upload-complete`

Security notes
- This is intentionally restricted to root uploads only to reduce accidental leakage or owner confusion.
- Enabling anonymous uploads increases risk of spam, malicious files, or storage abuse. Use only as a short-term workaround.
- Consider complementing this with server-side validation, virus scanning, rate-limiting, CAPTCHA, or a curated 'public' folder for uploads.

Recommended deployment steps
1. Set `ALLOW_ANONYMOUS_UPLOADS=true` in the Static Web App configuration or Function App settings for your staging/test environment.
2. Monitor uploads and storage usage closely. Add alerting to detect abnormal activity.
3. When Entra ID / Azure AD is available, disable the flag and remove this allowance.

Example (Azure Portal / Configuration setting)
- Name: `ALLOW_ANONYMOUS_UPLOADS`  Value: `true`
