# قرارداد API و conventions

## اصول عمومی
- Prefix: `/api/v1`؛ JSON؛ TLS در محیط‌های مشترک/production.
- خطا با `statusCode`, `code`, `message`, `requestId` و در صورت نیاز `details` برگردد؛ stack trace در response عمومی ممنوع.
- pagination cursor-based برای فهرست‌های بزرگ؛ limit سقف دارد (مثلاً 100) و مقدار از سرور enforce می‌شود.
- sort/filter فقط از allowlist؛ هرگز SQL یا field expression خام کلاینت را به query منتقل نکنید.
- تاریخ‌ها ISO-8601 در response؛ DB UTC؛ timezone برای نمایش در preference/user/org.
- `Idempotency-Key` برای endpointهای ایجاد حساس و عملیات قابل retry.
- `If-Match` یا فیلد `version` برای updateهای رقابتی.
- نسخه API و breaking change باید release note و contract test داشته باشد.

## شکل response پیشنهادی
```json
{
  "data": { "id": "..." },
  "meta": { "requestId": "..." }
}
```

## الگوی endpointها
- `GET /health`
- `GET /me` و `GET /organizations/current`
- `GET /tasks?status=TODO&assignee=me&cursor=...&limit=25`
- `POST /tasks` با عنوان و project اختیاری
- `PATCH /tasks/:id` با version و فیلدهای مجاز
- `POST /tasks/:id/transitions` با `toStatus` و reason اختیاری
- `POST /tasks/:id/comments`
- `GET/POST /accounts`, `/contacts`, `/leads`, `/deals`
- `GET/POST /tickets`, `POST /tickets/:id/messages`
- `GET /notifications`, `POST /notifications/:id/read`

## قواعد امنیتی
- هیچ endpoint مشتری نباید note/internal task/comment یا فایل داخلی را برگرداند.
- permission برای list، get-by-id، search، count، export، download و notification مستقل بررسی شود.
- response DTO allowlist داشته باشد تا فیلد حساس جدید سهواً public نشود.
- rate limit برای login، search عمومی، export، ارسال پیام و endpointهای expensive.
- OpenAPI منبع قرارداد؛ contract tests در CI اجرا شوند.

## OpenAPI
`docs/openapi.yaml` یک contract اولیه و غیرکامل است؛ قبل از تولید client از روی آن، endpointهای واقعی و security scheme را با API implementation هماهنگ کنید.
