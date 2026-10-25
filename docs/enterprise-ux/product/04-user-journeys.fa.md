# سفرهای کاربری و فلوهای پذیرش

## Lead تا Deal
```mermaid
flowchart TD
 A[Lead list] --> B[Filter/search]
 B --> C[Lead detail]
 C --> D[Qualification review]
 D --> E{Qualified?}
 E -->|Yes| F[Convert to account/contact/deal]
 E -->|No| G[Record reason]
 F --> H[Create next activity]
 H --> I[Audit + refresh timeline]
```
**پذیرش:** conversion transactionally سازگار است؛ retry/double-click رکورد تکراری نمی‌سازد؛ permission سمت API؛ audit و activity با نتیجه سازگارند.

## Support request
```mermaid
flowchart TD
 A[Inbox] --> B[Ticket/conversation]
 B --> C[Customer context + SLA]
 C --> D{Action}
 D -->|Public reply| E[Send state]
 D -->|Internal note| F[Internal timeline]
 D -->|Assign| G[Team/owner]
 D -->|Escalate| H[Priority/SLA policy]
 E --> I[Delivery status]
 F --> J[Audit]
 G --> J
 H --> J
```
**پذیرش:** reply و internal note مستقل؛ send state `queued/sent/failed`; idempotency؛ SLA server-side.

## کار روزانه
ورود → My Work → overdue/due tasks → filter و save view → task detail/drawer → تغییر status/owner/date → server confirmation → notification/audit.

## گزارش
انتخاب report → timezone/date/filter → تعریف metric و freshness → drill-down به records با همان access policy → export بعد از permission check و audit.

## دعوت عضو
Members → invite email/team/role → preview capability → invitation با expiry/token یکبارمصرف → پذیرش و membership → revoke با invalidation نشست طبق policy.

## شکست‌های مشترک
شبکه قطع، session expired، permission revoked، stale data، validation، 5xx و retry باید در تمام journeyها لحاظ شوند؛ عملیات حساس بعد از failure باید reconcile شود نه اینکه success کاذب بگوید.
