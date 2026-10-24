# تست و Quality Gates

## هرم تست
1. Unit: قوانین transition، normalization، SLA calculation، dedup score و policy.
2. Integration: PostgreSQL واقعی در test environment، transaction، constraints، queue و storage adapters.
3. Contract: OpenAPI، DTOs، client/server compatibility و error envelope.
4. E2E: Playwright برای وب و تست روی دستگاه/Expo برای موبایل.
5. Security negative tests: BOLA/IDOR، cross-org، private comments، search/export/file, role escalation.
6. Performance: p95 latency، query count، queue depth، export memory و search latency.
7. Accessibility/visual regression برای صفحات کلیدی.

## سناریوهای P0
- anonymous به داده خصوصی نمی‌رسد.
- member سازمان A به task/account/ticket/file سازمان B نمی‌رسد.
- مشتری فقط ticket و پیام customer-visible را می‌بیند.
- transition ممنوع در API رد می‌شود، حتی با request دست‌ساز.
- optimistic concurrency تغییر هم‌زمان را overwrite نمی‌کند.
- افزودن dependency حلقه را رد می‌کند.
- retry ایجاد task/ticket فقط یک مورد تولید می‌کند.
- notification worker با retry پیام تکراری نمی‌فرستد.
- user بدون permission نتواند count/search/export متفاوتی از scope مجاز استخراج کند.
- logout/revoke token و expiry به‌درستی اعمال می‌شوند.
- فیلد یا فایل حساس وارد log نمی‌شود.

## CI gate
- format، typecheck، unit، integration، contract، E2E ضروری، migration validation، dependency/license/secret scan.
- coverage درصد به‌تنهایی معیار نیست؛ branch/edge-case برای قوانین دامنه و security pathها لازم است.
- flaky test را به‌عنوان flaky ثبت و مالک/تاریخ حل تعیین کنید؛ بی‌صدا skip نکنید.
- schema changes باید migration در محیط تمیز را پاس کند.

## Definition of Done
تسک فقط زمانی بسته شود که acceptance criteria، permission, error/loading/empty states، تست، observability، docs و rollback strategy متناسب با ریسک کامل باشند.
