# DevOps، Observability و عملیات

## محیط‌ها
Local، CI، Staging و Production از هم جدا. داده production به dev کپی نشود مگر anonymization رسمی و مجوز داشته باشد.

## ساختار انتشار
- build artifact immutable و traceable به commit.
- migration expand/contract برای تغییرهای پرریسک.
- feature flags برای rolloutهای قابل برگشت.
- staging smoke + permission smoke + health check پیش از promote.
- rollback برنامه‌ریزی‌شده؛ schema change ممکن است نیاز به roll-forward داشته باشد.

## Observability
- logs ساختاریافته با `requestId`, `traceId`, `actorId` در حد مجاز، `organizationId` فقط با سیاست privacy، route، latency، result code.
- هرگز token، password، متن خصوصی ticket یا PII کامل را log نکنید.
- metrics: request rate/error/latency، DB pool waits، slow query، queue depth/age/retry/DLQ، notification success، file scanning failures، mobile crash-free sessions.
- traces با OpenTelemetry برای مسیر API→DB→queue/provider.
- alert مبتنی بر SLO و impact؛ از alert روی هر exception منفرد بپرهیزید.

## Backup & recovery
- تعیین RPO/RTO با مالک کسب‌وکار.
- backup رمزگذاری‌شده، دسترسی محدود، retention و خارج از failure domain.
- restore test دوره‌ای روی محیط جدا؛ وجود فایل backup به‌معنای قابل بازیابی بودن نیست.
- backup DB به‌تنهایی شامل object storage نیست؛ نسخه‌بندی/backup فایل و reconciliation لازم است.

## Incident runbook
1. severity و impact را مشخص کنید.
2. ابتدا نشت داده/مجوز را مهار کنید؛ در صورت لزوم feature/endpoint را disable کنید.
3. شواهد را حفظ کنید، نه secrets/PII غیرضروری.
4. owner و communication channel تعیین کنید.
5. recovery را در staging یا مسیر کنترل‌شده تأیید کنید.
6. بعد از رفع، root-cause، contributing factors و اقدامات پیشگیرانه ثبت شود.
