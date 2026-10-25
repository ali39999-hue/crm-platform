# راهنمای واردکردن بک‌لاگ به Jira و ابزارهای مشابه

فایل `execution/02-backlog.csv` را به‌عنوان source backlog وارد کن؛ آن را مستقیماً به sprintهای آینده assign نکن تا dependency و capacity بررسی شود.

## فیلدهای پیشنهادی
- `task_id`: حفظ به‌عنوان External ID یا custom field `Source Task ID`.
- `title`: Summary.
- `priority`: Priority؛ قبل از import مقدارهای `P0/P1/P2` را به سطح‌های پیکربندی Jira map کن.
- `epic`: Epic Link/Parent با Epicهای جداگانه‌ای که قبل از task import ساخته شده‌اند.
- `owner_role`: Component/Team یا custom field؛ آن را به assignee فردی تبدیل نکن.
- `estimate_tshirt`: custom field یا story-point mapping که تیم تصویب می‌کند؛ S/M/L را کورکورانه به points تبدیل نکن.
- `status`: وضعیت اولیه `TODO` در workflow مقصد map شود.
- `dependencies`: متن IDs را پس از import به issue linkهای واقعی تبدیل کن (`blocks` / `is blocked by`) و validate کن.
- `acceptance_criteria`: Description/Acceptance Criteria.
- `implementation_status`: custom field برای evidence rubric؛ از Jira workflow status جدا باشد.
- `evidence_required`: Description/Checklist یا custom field.

## مراحل امن
1. یک backup از project مقصد بگیر و در sandbox project تست import انجام بده.
2. `P0/P1/P2` و status values را با Jira configuration مقصد map کن.
3. Epicها را ایجاد کن؛ بعد tasks را با External ID وارد کن.
4. issue links را با IDهای مقصد وصل کن؛ مقدارهای مبهم یا dependencyهای ناموجود را در report نشان بده.
5. ۵ task نمونه را دستی بررسی کن: encoding فارسی، newline، comma، descriptions و fields.
6. duplicate detection و idempotent re-import plan داشته باش؛ import دوم نباید task تکراری بسازد.
7. CSV پس از import source of truth مستقل باقی بماند تا تطبیق نهایی انجام شود؛ Jira statusها را export کن و اختلاف را reconcile کن.

این CSV schema عمومی است و تضمین نمی‌کند مستقیم بدون mapping به تمام نسخه‌های Jira/Linear وارد شود. نوع issue، custom fields، hierarchy و link syntax باید با workspace واقعی تطبیق داده شود.
