## 13. پنجاه مخزن مرجع پیشنهادی

**روش استفاده:** این ۵۰ مخزن فهرست مطالعه و benchmark هستند، نه ۵۰ وابستگی اجباری. برای هر منبع، README، معماری، تست، امنیت، مدل داده، سطح فعالیت و مجوز همان commit/tag را بررسی کنید. معمولاً فقط ساختارها و ایده‌ها را اقتباس می‌کنیم؛ clone مستقیم کد به محصول اصلی بدون بررسی license و وابستگی‌ها ممنوع است.

### A. CRM، مدیریت کار و Support — ۱۰ مخزن

1. [Twenty](https://github.com/twentyhq/twenty) — مدل CRM مدرن، account/contact/deal، custom data model و الگوی صفحه‌های CRM. بررسی مجوز نسخه جاری ضروری است.
2. [Plane](https://github.com/makeplane/plane) — issue/task tracker، board، cycle، module، view و roadmap؛ مرجع UX برای مدیریت کار.
3. [Chatwoot](https://github.com/chatwoot/chatwoot) — shared inbox و تجربه پشتیبانی مشتری، ticket/conversation و کانال‌های ارتباطی.
4. [EspoCRM](https://github.com/espocrm/espocrm) — CRM کلاسیک با workflowها و مدل‌های فروش؛ مرجع برای CRM سازمانی.
5. [Frappe CRM](https://github.com/frappe/crm) — pipeline و فعالیت‌های فروش؛ مطالعه ساختار مدل و جریان فروش.
6. [ERPNext](https://github.com/frappe/erpnext) — ارتباط CRM با ERP و فرایندهای تجاری؛ دامنه آن از نیاز MVP گسترده‌تر است.
7. [OpenProject](https://github.com/opf/openproject) — پروژه/portfolio، milestone، Gantt و مدیریت رسمی کار.
8. [Leantime](https://github.com/Leantime/leantime) — تسک و برنامه‌ریزی برای کاربران غیرتخصصی؛ توجه به شرایط مجوز و استثناها.
9. [Vikunja](https://github.com/go-vikunja/vikunja) — task manager، فهرست و تجربه مدیریت کار؛ مجوز نسخه مورد استفاده را بررسی کنید.
10. [Taiga](https://github.com/taigaio/taiga) — agile project management، sprint و workflowهای تیمی.

### B. وب و Design System — ۱۰ مخزن

11. [Next.js](https://github.com/vercel/next.js) — ساختار app، rendering و routeها؛ راهنمای رسمی App Router را نیز بخوانید.
12. [shadcn/ui](https://github.com/shadcn-ui/ui) — الگوی componentهای قابل مالکیت و design system وب؛ componentها را آگاهانه وارد پروژه کنید.
13. [Radix Primitives](https://github.com/radix-ui/primitives) — semantics و primitiveهای قابل دسترس برای dialog/popover/menu.
14. [TanStack Query](https://github.com/TanStack/query) — server-state، cache، invalidation و mutation lifecycle.
15. [TanStack Table](https://github.com/TanStack/table) — جدول‌های داده‌ای headless با sort/filter/selection.
16. [React Hook Form](https://github.com/react-hook-form/react-hook-form) — مدیریت فرم و performance.
17. [Zod](https://github.com/colinhacks/zod) — schema validation و type inference؛ اعتبارسنجی سمت سرور هم لازم است.
18. [dnd-kit](https://github.com/clauderic/dnd-kit) — تعامل drag-and-drop برای board؛ fallback دسترس‌پذیر فراموش نشود.
19. [FullCalendar](https://github.com/fullcalendar/fullcalendar) — تقویم و event interaction؛ مجوز و امکانات مورد نیاز را بررسی کنید.
20. [Storybook](https://github.com/storybookjs/storybook) — مستندسازی، بررسی بصری و تست componentها.

### C. API، دیتابیس، queue و monorepo — ۱۰ مخزن

21. [NestJS](https://github.com/nestjs/nest) — ماژول‌بندی API، guard، validation، queue و WebSocket.
22. [PostgreSQL](https://github.com/postgres/postgres) — منبع اصلی داده؛ مستندات رسمی SQL و Row-Level Security را مرجع قرار دهید.
23. [Prisma ORM](https://github.com/prisma/prisma) — schema، migration و type-safe DB access؛ محدودیت‌های queryها را ارزیابی کنید.
24. [Redis](https://github.com/redis/redis) — cache، limiter و queue backing؛ منبع حقیقت داده کسب‌وکار نباشد.
25. [BullMQ](https://github.com/taskforcesh/bullmq) — job queue، retry و workerهای پس‌زمینه.
26. [Temporal](https://github.com/temporalio/temporal) — الگوی durable workflow؛ گزینه‌ای برای فرایندهای طولانی، نه الزام MVP.
27. [Socket.IO](https://github.com/socketio/socket.io) — realtime event delivery؛ authorization و بازیابی پس از reconnect لازم است.
28. [Turborepo](https://github.com/vercel/turborepo) — pipeline ساخت و cache در monorepo.
29. [pnpm](https://github.com/pnpm/pnpm) — package manager و workspaceها.
30. [Orval](https://github.com/orval-labs/orval) — تولید client/type از OpenAPI؛ خروجی باید versioned و در CI کنترل شود.

### D. موبایل، تست و کیفیت — ۱۰ مخزن

31. [Expo](https://github.com/expo/expo) — ساخت و انتشار اپ React Native با ابزارهای اکوسیستم Expo.
32. [React Native Paper](https://github.com/callstack/react-native-paper) — componentهای Material برای موبایل؛ با design system محصول تطبیق داده شود.
33. [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) — انیمیشن‌های native-performance؛ فقط در جایی که UX را بهتر می‌کند.
34. [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) — تعامل gesture در موبایل.
35. [React Native MMKV](https://github.com/mrousavy/react-native-mmkv) — storage سریع محلی؛ به‌تنهایی secure secret vault نیست.
36. [Zustand](https://github.com/pmndrs/zustand) — state محلی سبک؛ server-state را بی‌دلیل با آن جایگزین نکنید.
37. [Playwright](https://github.com/microsoft/playwright) — E2E وب و سناریوهای حیاتی.
38. [Vitest](https://github.com/vitest-dev/vitest) — unit/integration test برای TypeScript.
39. [React Testing Library](https://github.com/testing-library/react-testing-library) — تست از دید کاربر، نه وابسته به جزئیات داخلی component.
40. [MSW](https://github.com/mswjs/msw) — mock شبکه در تست و توسعه؛ جای integration test واقعی DB را نمی‌گیرد.

### E. هویت، سیاست دسترسی، Observability و اتصال‌ها — ۱۰ مخزن

41. [Keycloak](https://github.com/keycloak/keycloak) — هویت، SSO و OIDC؛ گزینه بررسی برای سازمان‌ها.
42. [Casbin](https://github.com/casbin/casbin) — مدل‌های policy/RBAC/ABAC؛ فقط پس از مقایسه با نیازهای واقعی مجوز انتخاب شود.
43. [OpenFGA](https://github.com/openfga/openfga) — relationship-based authorization برای دامنه‌های پیچیده؛ احتمالاً برای MVP ضروری نیست.
44. [Cerbos](https://github.com/cerbos/cerbos) — policy-based authorization؛ هزینه عملیاتی و نیاز تیم را بررسی کنید.
45. [OpenTelemetry JS](https://github.com/open-telemetry/opentelemetry-js) — instrumentation و trace/metrics/log context.
46. [Grafana](https://github.com/grafana/grafana) — dashboard و مشاهده متریک‌ها.
47. [Sentry](https://github.com/getsentry/sentry) — خطا و performance monitoring؛ گزینه‌های self-hosted/تجاری و حریم خصوصی بررسی شوند.
48. [n8n](https://github.com/n8n-io/n8n) — مطالعه اتوماسیون و اتصال سرویس‌ها؛ مجوز آن source-available/محدودیت‌دار است و نباید خودکار «open source مجاز برای embed» فرض شود.
49. [Formbricks](https://github.com/formbricks/formbricks) — فرم و بازخورد محصول؛ برای جمع‌آوری feedback و survey مرجع است.
50. [Cal.com](https://github.com/calcom/cal.com) — scheduling و رزرو جلسه؛ مجوز و محدوده قابلیت‌های نسخه جاری بررسی شود.

### روش benchmark برای هر مخزن

برای هر مورد در یک سند ارزیابی ثبت شود:

- مسئله‌ای که حل می‌کند و بخش‌هایی که برای ما relevant هستند.
- زبان، framework، معماری و مدل داده.
- آخرین release/commit و تعداد issueهای مهم باز؛ آمار GitHub فقط نشانه اولیه است، نه تضمین کیفیت.
- تست‌ها، CI، security policy و راهنمای contribution.
- فایل `LICENSE` و license تمام dependencyها/assetها؛ محدودیت SaaS، تجاری، attribution و copyleft.
- دقیقاً چه چیزی قرار است اقتباس شود: ایده UX، API contract، الگوریتم، component یا کد.
- هزینه نگهداری و مالک داخلی آن پس از اقتباس.

**هشدار مجوز:** برای محصولات دارای AGPL/GPL، مجوزهای source-available یا پوشه‌های enterprise، بررسی حقوقی را قبل از ادغام کد انجام دهید. مشاهده GitHub یا داشتن امکان clone به‌معنای اجازه استفاده تجاری/بازتوزیع نیست.

---



## توجه
این فهرست برای benchmark و مطالعه است؛ قبل از clone/اقتباس، activity، license، dependency، security policy و امکانات نسخه/tag انتخاب‌شده را دوباره بررسی کنید. لینک بودن به معنای تأیید حقوقی یا امنیتی نیست.
