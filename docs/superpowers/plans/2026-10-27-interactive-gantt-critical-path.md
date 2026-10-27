# برنامه اجرایی گانت‌چارت تعاملی سازمانی و موتور مسیر بحرانی (Critical Path)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** پیاده‌سازی کامل موتور زمان‌بندی گانت‌چارت (Gantt Chart Scheduling Engine)، کشف مسیر بحرانی (Critical Path Method - CPM)، محاسبه شناوری و نمایش بصری تقویم هفتگی و ماهانه شمسی در وب و موبایل.

**Architecture:**
1. لایه دامنه (`packages/domain/src/gantt.ts`): الگوریتم Forward Pass / Backward Pass برای محاسبه Earliest/Latest Start & Finish، محاسبه Slack (شناوری) و استخراج قطعی مسیر بحرانی با تست‌های TDD.
2. لایه قراردادها (`packages/contracts/src/index.ts`): تعاریف تایپ‌های `GanttTaskDto` و `GanttProjectScheduleDto`.
3. لایه سرور (`apps/api`): افزودن اندپوینت محاسبه گانت پروژه در `ProjectsController` و به‌روزرسانی وابستگی‌ها.
4. لایه وب (`apps/web`): کامپوننت `GanttChartView.tsx` با قابلیت تغییر زوم روزانه/هفتگی جلالی، نمایش خطوط پیش‌نیاز، رنگ‌آمیزی مسیر بحرانی و درصد پیشرفت وزنی.
5. لایه موبایل (`apps/mobile`): نمایش نشانگر مسیر بحرانی و تقدم/تاخر در کارت کارهای پروژه.

**Tech Stack:** TypeScript, Next.js 16, NestJS 12, Vitest, Expo React Native.

---

### Task 1: الگوریتم زمان‌بندی گانت و کشف مسیر بحرانی (CPM) در `@crm/domain`
- Create: `packages/domain/src/gantt.ts`
- Test: `packages/domain/src/gantt.spec.ts`
- Export from `packages/domain/src/index.ts`

### Task 2: قراردادها و DTOهای گانت‌چارت در `@crm/contracts`
- Modify: `packages/contracts/src/index.ts`
- Run `pnpm --filter @crm/contracts build`

### Task 3: سرویس و روت‌های API گانت‌چارت در `apps/api`
- Modify: `apps/api/src/modules/projects/project.service.ts`
- Modify: `apps/api/src/modules/projects/project.controller.ts`
- Test: `apps/api/src/modules/projects/project.spec.ts`

### Task 4: کامپوننت تعاملی گانت‌چارت در `apps/web`
- Create: `apps/web/src/components/GanttChartView.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Run `pnpm --filter @crm/web typecheck`

### Task 5: ارتقای کلاینت موبایل و راستی‌آزمایی جامع
- Modify: `apps/mobile/App.tsx`
- Run all 580+ unit and integration tests
- Push to GitHub and monitor CI pipeline
