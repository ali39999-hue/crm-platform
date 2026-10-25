# قرارداد حالت صفحه و تعامل

| حالت | UI | رفتار/تست |
|---|---|---|
| Loading | skeleton نزدیک به layout واقعی | action نامعتبر disabled؛ layout shift محدود |
| Empty first-use | توضیح + CTA اصلی | هیچ داده mock را واقعی جا نزند |
| Empty filtered | no results + clear filters | clearing به URL sync شود |
| Error | متن کاربردی + retry | draft حفظ؛ error telemetry |
| Forbidden | دسترسی ندارید؛ بدون افشای رکورد | direct URL و API هر دو denied |
| Stale | freshness/refresh affordance | overwrite بی‌هشدار ممنوع |
| Partial | widget معیوب جدا نشان داده شود | failure یک بخش کل صفحه را نشکند |
| Saving | spinner/status و disabled submit | double submit کنترل شود |
| Save failed | input حفظ + field summary | retry امن و اصلاح‌پذیر |
| Success | پیام کم‌حجم و لینک رکورد | داده پس از refresh پابرجاست |
| Offline | نشان offline | queue فقط اگر واقعاً پشتیبانی شده |
| Conflict | نمایش نسخه/تعارض و مسیر حل | همزمانی دو session تست شود |
| Session expired | login با return محدود | بدون redirect loop و حفظ امن draft |

## Forms
label واقعی (نه فقط placeholder)، خطای کنار فیلد + summary، validation سمت client و server، dirty state و unsaved guard، timezone-aware dates و وابستگی فیلدها.

## Tables
server pagination/filter/sort؛ URL state؛ saved views؛ selection مشخص (صفحه یا کل نتیجه فیلترشده)؛ bulk preview؛ keyboard support و mobile alternative.
