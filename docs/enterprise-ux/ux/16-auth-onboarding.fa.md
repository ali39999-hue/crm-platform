# UX مشخصات: Auth، Invite و Recovery

Auth lifecycle شامل sign-in/out، refresh، expiry، revoke و concurrent session policy. Password reset/invitation token یک‌بارمصرف، hashشده در storage، کوتاه‌عمر و rate limited. خطاها وجود email را افشا نکنند؛ return URL allowlist و open redirect ممنوع. fake auth/header identity/hardcoded demo users برای محیط واقعی ممنوع.

## Onboarding
پذیرش invitation معتبر → profile/locale/timezone → workspace دارای membership → tour قابل skip → empty state با اقدام بعدی.

## Recovery states
pending/expired/invalid/already-used/success جدا؛ token در log/analytics/referrer نرود؛ sessionهای قدیمی طبق policy revoke شوند.

## Acceptance
API بدون session authenticated نیست؛ تغییر user/tenant cache leakage ندارد؛ cookie/CORS/CSRF/redirect بررسی شده؛ flowها keyboard و mobile قابل استفاده‌اند.
