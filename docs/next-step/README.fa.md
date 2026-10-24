# بسته اقدام بعدی CRM

این بسته حاصل ممیزی ایستای مخزن عمومی CRM در ۲۴ اکتبر ۲۰۲۶ است و هیچ تغییری را در GitHub اعمال نمی‌کند.

- `POST_BOOTSTRAP_AUDIT.fa.md`: گزارش یافته‌ها و ترتیب اجرایی.
- `ci.yml.corrected`: نمونه کامل workflow با ترتیب اصلاح‌شده.
- `ci-fix.patch`: patch کوچک برای اصلاح ترتیب setupها؛ فایل workflow را قبل از اعمال با نسخه موجود مقایسه کنید.
- `SPRINT_01_BACKLOG.csv`: taskهای اولویت‌دار sprint بعدی.
- `AGENT_PROMPT.fa.md`: پرامپت آماده برای Coding Agent.

## شروع پیشنهادی

1. branch: `fix/ci-bootstrap-and-task-api`
2. اول فقط workflow را اصلاح کنید و CI را مجدداً اجرا کنید.
3. پس از سبز شدن CI، کار persistence واقعی Task و تست جداسازی سازمان‌ها را شروع کنید.
4. سپس کلاینت وب و موبایل را به API وصل کنید.

نسخه `ci.yml.corrected` از majorهای جاری GitHub Actions استفاده می‌کند. قبل از ادغام نهایی، سازگاری نسخه‌ها با policy مخزن و release notes را مرور کنید. اجرای محلی این بسته در محیط تهیه گزارش انجام نشده است.
