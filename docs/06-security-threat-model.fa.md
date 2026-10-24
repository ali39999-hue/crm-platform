# Threat Model و baseline امنیت

## دارایی‌ها
داده مشتری و کارکنان، قراردادها/تیکت‌ها، فایل‌ها، session/token، audit trail، secrets اتصال‌ها، اطلاعات سازمان و exportها.

## مرز اعتماد
Browser/mobile غیرقابل اعتماد؛ API مرجع authorization؛ DB private؛ worker دارای مجوز محدود؛ object storage فقط پشت لینک زمان‌دار؛ integration token محدود به scope.

## تهدیدها و کنترل‌ها
| تهدید | کنترل پایه | تست اجباری |
|---|---|---|
| BOLA/IDOR | authorize هر object بر اساس org + relation + action | کاربر سازمان A، شناسه سازمان B را fetch/update نکند |
| Cross-tenant leak | tenant scope در repository/use case و ترجیحاً DB constraints/RLS | لیست، count، search، export و file cross-org |
| Privilege escalation | least privilege، MFA برای admin، separation of duties | member نتواند role/owner policy را دور بزند |
| Private note leak | visibility policy در response query و notification | مشتری note داخلی، push یا attachment داخلی را نبیند |
| Injection/XSS | input validation، output encoding، CSP و ORM parameterization | payloadهای HTML/SQL در fields و search |
| CSRF/session theft | cookie policy/CSRF متناسب با auth، rotation، secure flags | mutation cross-site و session revocation |
| File malware/oversize | size/type limits، quarantine/scan، signed URL expiry | فایل نامعتبر/بزرگ/منقضی/غیرمجاز |
| Webhook replay | signature verification، timestamp window، idempotency | replay و invalid signature |
| Queue duplicate | unique idempotency key، bounded retry و DLQ | duplicate delivery/retry storm |
| Secret leak | secret manager، scanning، rotation | CI secret scan و log scan |
| Audit tampering | write-only access path، restricted delete، retention | worker/user معمولی نتواند audit را حذف کند |

## baseline
- OWASP ASVS متناسب با سطح ریسک؛ threat model هنگام تغییر auth/permission/files/export.
- TLS، secure headers، CSP report/enforce با rollout کنترل‌شده.
- OIDC/OAuth2 را از خود نسازید مگر ضرورت قوی؛ issuer، audience، nonce/state، PKCE و key rotation کنترل شود.
- MFA برای کاربران privileged و lifecycle revoke session.
- rate limiting، brute-force protection و abuse monitoring.
- رمزنگاری در انتقال و ذخیره‌سازی؛ مدیریت key جدا از دیتابیس.
- retention/deletion policy برای PII و export؛ audit log فاقد secret.
- SBOM، dependency audit، code scanning، secret scanning و license review در CI.

## نکته قانونی
قوانین قابل اعمال به محل استقرار، مشتریان و نوع اطلاعات وابسته‌اند؛ پیش از production، مسئول حقوقی/privacy باید GDPR، DPA، data residency، retention و قراردادهای processor را بررسی کند. این فایل مشاوره حقوقی نیست.
