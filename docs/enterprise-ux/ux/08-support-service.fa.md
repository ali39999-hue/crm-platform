# UX مشخصات: Support، Inbox، Ticket و SLA

## Domain
Conversation رشته گفتگو/کانال است؛ Ticket واحد قابل پیگیری با status/owner/SLA. آن‌ها را بدون تصمیم روشن یکی فرض نکن.

## Inbox layout
queue/list با saved views؛ panel مکالمه؛ customer context و SLA/assignment؛ mobile به navigation رفت‌وبرگشت تبدیل شود. Filters: unread, assigned to me, unassigned, priority, SLA risk, team.

## Composer
`Public reply` و `Internal note` از نظر visual و semantics جدا باشند. recipient/visibility پیش از ارسال روشن؛ attachment/rich text پس از security/XSS review. send state: draft/queued/sent/failed؛ retry با idempotency key.

## Ticket detail
subject/status/priority/owner/team/requester/linked customer/SLA/created/updated؛ timeline با message/note/status/assignment/automation. SLA business calendar، holiday، timezone و pause در سرور تعریف شود.

## Handoff and SLA
تغییر team/owner audit و notification مجاز ایجاد کند. escalation deterministic/idempotent باشد. warning before breach، breached و paused از هم جدا؛ metric تعریف start/stop داشته باشد.

## Security acceptance
internal note در portal، email، export و search snippet ظاهر نشود؛ attachment ID مستقیم مجوز را دور نزند.
