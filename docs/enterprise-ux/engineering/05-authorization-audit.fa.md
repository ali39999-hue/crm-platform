# احراز هویت، مجوزدهی و Audit

## Authentication
هویت باید از session/token معتبر با signature، issuer/audience، expiry و rotation policy استخراج شود. هیچ header آزاد مثل `x-user-id` یا token opaque که بدون اعتبارسنجی نقش bearer credential را دارد، trusted identity نیست. secrets فقط از secret manager/environment معتبر و rotation پذیر.

## Authorization layers
- Authentication: چه principalی درخواست داده؟
- Membership: آیا عضو همین workspace است؟
- Permission/policy: برای این resource/action مجاز است؟
- Resource scope: آیا record زیر workspace مجاز است؟
- Field/transition rule: آیا فیلد حساس یا انتقال وضعیت مجاز است؟

Frontend visibility برای UX است؛ backend enforcement مرجع امنیت. deny-by-default برای endpoint و fieldهای حساس.

## Permission matrix
برای هر action، نقش، resource scope و policy ثبت شود. آزمون‌ها باید allow و deny داشته باشند: unauthenticated، عضو tenant دیگر، role ناکافی، resource غیرموجود/مخفی، tenant mismatch، bulk action و export. 404 در برابر 403 براساس policy ضد enumeration انتخاب شود.

## Audit event
حداقل: eventId, occurredAt, actor, workspace, action, resource type/id، result، requestId، safe diff/field list، source. password/token/secret/PII غیرلازم در audit log قرار نگیرد. log باید tamper-resistant access/retention، query permissions و redaction policy داشته باشد.

## Critical acceptance
- هیچ endpoint حساس به `x-user-id` تنها اعتماد نکند.
- IDOR/cross-tenant test برای هر resource type.
- role downgrade/revoke اثر فوری یا در حد session policy تعریف‌شده داشته باشد.
- audit در transaction حساس گم نشود.
- permission cache پس از تغییر role invalidated شود.
