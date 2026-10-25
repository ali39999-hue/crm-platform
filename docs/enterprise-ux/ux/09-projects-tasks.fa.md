# UX مشخصات: پروژه‌ها، Task، Boards، Cycles و Roadmaps

## Task detail
Header: key/title/status/priority/assignee/due date/actions. Body: description، parent/subtask، relations (blocks/blocked-by/relates/duplicates)، estimate/time log، comments، files، checklist و activity؛ فقط داده مجاز نمایش داده شود.

## View modes
- Table/list برای حجم و bulk edit.
- Kanban برای transition/status.
- Calendar برای due date/event.
- Timeline/Gantt برای dependency/date-range معنادار (P2 مگر نیاز ثابت شود).
- Roadmap برای project/initiative/milestone.

تمام viewها query semantics و permission مشترک دارند؛ تغییر هر view به یک domain operation می‌رود.

## State machine
`Backlog → Todo/Ready → In Progress → In Review/Blocked → Done` نمونه است. statusها configurable اما transition graph سروری؛ reopen/blocked reason policy دارد.

## Board
Drag/drop با keyboard fallback؛ card شامل ID/title/priority/assignee/due/labels محدود. WIP limits فقط اگر تعریف شده؛ server rejection rollback و پیام کاربردی.

## Dependencies/cycles
Cycle detection، rules روشن برای closing/moving cycle، audit و notification throttling. Comments/mentions/edit history/estimate/time logging policy دارند.

## E2E
Create project → create task → assign → status change → mention → due date → complete → verify My Work/analytics/audit/authorization.
