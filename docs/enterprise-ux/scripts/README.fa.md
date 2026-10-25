# ابزار benchmark metadata

## نیازمندی
Python 3.10+ و دسترسی شبکه به `api.github.com`. برای rate limit بالاتر می‌توان `GITHUB_TOKEN` را به‌صورت environment variable تنظیم کرد؛ token را داخل فایل یا command line قرار ندهید.

## اجرا از ریشه بسته

```bash
python scripts/collect_github_metadata.py --input research/01-references.csv --out-dir research/generated --delay-seconds 1.2
```

برای اجرای آزمایشی ۱۰ مخزن:

```bash
python scripts/collect_github_metadata.py --input research/01-references.csv --out-dir research/generated --limit 10
```

## خروجی
- `github-repository-metadata.csv`
- `github-repository-metadata.json`
- `collection-errors.csv` اگر خطایی رخ دهد.

اسکریپت فقط metadata عمومی repository را از REST API دریافت می‌کند؛ code، issue body، private data، credential یا assets را scrape نمی‌کند و کد مخازن را اجرا/clone نمی‌کند. License metadata به‌تنهایی مجوز حقوقی استفاده از تمام فایل‌های آن repository نیست. رعایت rate limit و شرایط GitHub الزامی است. Collector تا زمان اجرای واقعی توسط کاربر، داده تازه‌ای تولید نکرده است.
