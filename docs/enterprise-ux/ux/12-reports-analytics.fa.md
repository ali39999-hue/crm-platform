# UX مشخصات: Analytics، Reports و Forecast

هر KPI باید definition، owner، source، timezone، aggregation period و access scope داشته باشد؛ dashboard و report نباید formula متناقض داشته باشند.

## Dashboard
3–6 KPI actionable؛ chart title/unit/period/legend/empty/error؛ drill-down با filter یکسان؛ data freshness واضح. Widgetهای مستقل باید failure isolation داشته باشند.

## Report builder
1. dataset مجاز؛ 2. fields با PII classification؛ 3. filter/group/aggregate/chart؛ 4. preview query-limited و save؛ 5. schedule/export تنها با permission و audit.

## Forecast
Pipeline value/weighted value/close date/category از data واقعی؛ formula و currency policy مستند. null/unknown بی‌صدا صفر نشود.

## Export
Authorization روی row و column؛ row/rate limit، audit، signed download و expiry. CSV formula injection بررسی شود؛ report export شده filter/timezone/definition را همراه داشته باشد.
