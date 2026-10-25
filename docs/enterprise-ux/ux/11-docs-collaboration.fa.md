# UX مشخصات: Docs، فایل و همکاری

## Docs
درخت/space، breadcrumb، search، favorite/recent، revision history. Autosave فقط با `Saving/Saved/Offline/Conflict` روشن. سطح access: private/team/workspace/customer-visible با پیش‌فرض محافظه‌کارانه. انتشار مشتری preview + explicit publish دارد.

## Files
Attachment entity از storage object جدا باشد. Metadata: owner/tenant/record/visibility/scan status. Upload با progress و policy نوع/حجم؛ server content validation و malware scan در صورت امکان؛ private bucket و signed URL کوتاه‌عمر. download هر بار authorization؛ URL قابل حدس ممنوع.

## Comments/Mentions
Thread/reply/mention picker/unread state؛ mention recipient طبق tenant و visibility فیلتر شود. Markdown/rich-text sanitizer و XSS tests؛ تغییرات حساس audit شوند.

## Internal vs customer-visible
Visibility جزو domain/API است، نه صرفاً UI flag. list/detail/export/notification/email باید policy واحد را enforce کنند.
