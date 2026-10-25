# کاتالوگ کامپوننت و قواعد داخلی

## Foundation
Typography, Icon, Button, Link, FocusRing, Separator, Tooltip, VisuallyHidden, Skeleton, Spinner, Kbd, Avatar, Badge, StatusIndicator.

## Navigation
AppShell, Sidebar, MobileNav, WorkspaceSwitcher, Breadcrumbs, CommandPalette, GlobalSearch, Tabs, Pagination, BackLink.

## Data display
DataTable, ColumnHeader, FilterBuilder, FilterChip, SavedViewPicker, Sort/Grouping menu, Board/Column, RecordCard, Timeline, Calendar, ActivityFeed, MetricCard, ChartPanel, EmptyState.

## Data entry
FormField, TextInput, Textarea, Select, Combobox, MultiSelect, DatePicker, DateRangePicker, CurrencyInput, PhoneInput, RichTextEditor, FileUpload, UserPicker, TeamPicker, TagPicker, EntityReferencePicker.

## Workflow and feedback
StatusSelect, PrioritySelect, AssigneeControl, DueDateControl, InlineEdit, BulkActionBar, CommentComposer, MentionPicker, SLAIndicator, Dialog, AlertDialog, Drawer, Popover, DropdownMenu, Toast, InlineAlert, ErrorBoundary, ConfirmAction, UnsavedChangesDialog, PermissionDenied, NetworkStatus, ConflictResolution.

## Component rules
- component عمومی business-specific logic ندارد.
- DataTable منطق fetch/filter را از render جدا کند و برای dataset واقعی server-side باشد.
- dialog/drawer focus trap، Escape و return focus دارد.
- button variant محدود و معنی‌دار: primary/secondary/tertiary/danger/ghost.
- status label متنی دارد؛ رنگ تنها signal نیست.
- هر component بحرانی stateها، keyboard، responsive و RTL را در Storybook/test harness نمایش دهد.
- انتخاب کتابخانه بعد از بررسی codebase، bundle, accessibility و license است؛ dependencyهای مشابه متعدد نصب نکن.

## ممنوع

Toast موفقیت ساختگی، داده نمونه به‌عنوان fallback واقعی، skeleton بی‌ارتباط با layout، disabled action بدون توضیح و modal برای هر جزئیات ساده.
