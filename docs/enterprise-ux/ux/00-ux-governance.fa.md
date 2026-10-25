# حاکمیت UX و Page Contract

هر صفحه باید route ID، actor/JTBD، data source/API operation، permission، primary/secondary/destructive actions، حالت‌های loading/empty/error/forbidden/stale/partial/success/offline/conflict، keyboard/focus، responsive behavior، analytics بدون PII، criteria و تست داشته باشد.

## جریان Design QA
`Unknown → Mapped → Wireframed → Contracted → Implemented → Tested → Visual QA → Accepted`. هر transition evidence می‌خواهد؛ «کد نوشته شد» معادل Accepted نیست.

## Consistency rules
- یک الگوی Create/Edit form و یک الگوی Record detail.
- یک DataTable pattern؛ اختلافات باید دلیل داشته باشند.
- toast برای نتیجه کوتاه؛ error قابل اقدام inline/banner.
- status با label/icon و رنگ فقط نشانه ثانویه.
- save با pending/disabled و محافظت double submit.
- فرم طولانی sectioning/draft/save-and-continue.
- bulk actions تعداد و scope را قبل از اجرا نشان دهند.

## Definition of Ready
Story و criteria؛ route/permission؛ API success/error schema؛ طراحی stateها و responsive؛ seed data؛ dependency/flag.

## Definition of Done
UI به API واقعی وصل؛ unit/integration/E2E پاس؛ negative permission tests؛ keyboard/axe؛ screenshot در سه viewport؛ audit/analytics/docs به‌روزرسانی؛ بدون secret/PII در artifact.
