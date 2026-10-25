# UX مشخصات: Customer Portal امن

Portal یک مرز امنیتی مستقل است، نه فقط theme متفاوت. مشتری فقط ticketهای خودش، public messages، اسناد منتشرشده و اطلاعاتی را می‌بیند که policy اجازه داده.

## Sitemap
`/portal/login`, `/portal/home`, `/portal/requests`, `/portal/requests/new`, `/portal/requests/:id`, `/portal/documents`, `/portal/profile`, `/portal/help` (اگر knowledge base منتشر شده).

## UX
Navigation کم‌گزینه/mobile-first؛ request detail شامل public message، status، attachments مجاز و اطلاعات SLA مجاز. Internal note، internal file، team-only tag و اطلاعات دیگر مشتری افشا نشود.

## Security acceptance
Negative tests برای customer A→B در list/detail/search/attachment/export/direct API. Notification/email/public share هم policy را رعایت کنند. share token scope و expiry داشته باشد.
