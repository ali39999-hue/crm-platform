# UX مشخصات: Admin و پیکربندی سازمان

## Areas
Workspace profile/timezone/locale/branding؛ members/invitations/teams/roles/sessions؛ custom fields/layouts/status/pipelines؛ notification preferences؛ integrations/API keys/webhooks؛ security/retention/audit.

## High-risk changes
برای role, SSO, API key, retention, webhook target, bulk field change و disable integration: preview اثر، re-auth در صورت نیاز، confirmation، audit و recovery instructions.

## Membership
Invitation lifecycle pending/accepted/expired/revoked؛ role summary به زبان business و capability details؛ revoke باید sessionها را طبق policy باطل کند؛ از افشای membership در tenant دیگر جلوگیری شود.

## Configuration
Field key پایدار و type مشخص؛ حذف فیلد با archive/deprecate و migration plan؛ pipeline status change strategy برای رکوردهای موجود؛ validation سمت سرور.

## Audit log
Filter actor/action/object/time/outcome/correlation. payload redacted؛ export audit خودش audit می‌شود.
