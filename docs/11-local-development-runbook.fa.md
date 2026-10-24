# Runbook توسعه محلی

## شروع
1. Docker daemon فعال باشد.
2. `.env.example` را به `.env` کپی کنید.
3. `docker compose up -d`.
4. Node/pnpm را مطابق `README.fa.md` آماده کنید.
5. `pnpm install` و commit کردن lockfile.
6. `pnpm dev`.

## health checks
- PostgreSQL: `docker compose ps` و `pg_isready` داخل container.
- Redis: `docker compose exec redis redis-cli ping`.
- API: `curl http://localhost:4000/api/v1/health`.
- Web: `http://localhost:3000`.
- MinIO Console: `http://localhost:9001`.

## reset محیط محلی
`docker compose down` containerها را متوقف می‌کند. `docker compose down -v` داده‌های volume را حذف می‌کند؛ فقط برای توسعه محلی و پس از اطمینان از اینکه داده لازم نیست.

## عیب‌یابی
- اتصال DB: `DATABASE_URL` و `DIRECT_URL` با compose هماهنگ باشند.
- Prisma 7: client باید generate شود و runtime client باید driver adapter PostgreSQL دریافت کند.
- Expo روی دستگاه فیزیکی: `EXPO_PUBLIC_API_URL` باید IP قابل دسترس توسعه‌دهنده باشد؛ `10.0.2.2` صرفاً برای Android emulator است.
- پورت اشغال: مقدارهای ports را تنظیم کنید و URLها را هم‌زمان تغییر دهید.

## نکات
این compose برای dev است، نه production. MinIO از tag `latest` استفاده می‌کند تا توسعه ساده بماند؛ برای محیط مشترک tag دقیق و معتبر را pin کنید. از default passwordها خارج از local استفاده نکنید.
