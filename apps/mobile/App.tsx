import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {
  TaskPriority,
  TaskStatus,
  TaskSummary,
  TicketDto,
  TicketPriority,
} from '@crm/contracts';
import { canTransitionTask } from '@crm/domain';

const INITIAL_MOBILE_TASKS: TaskSummary[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    key: 'TSK-1001',
    title: 'بررسی مدارک و اعتبارسنجی قرارداد مشتری جدید',
    status: 'TODO',
    priority: 'HIGH',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    projectId: null,
    dueAt: '۱۴۰۵/۰۸/۰۴',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    key: 'TSK-1002',
    title: 'پیاده‌سازی تست‌های امنیتی احراز هویت و مجوزها',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    projectId: null,
    dueAt: '۱۴۰۵/۰۸/۰۲',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    key: 'TSK-1003',
    title: 'بازبینی معماری پایگاه داده و شاخص‌گذاری جدول‌های CRM',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    visibility: 'INTERNAL',
    assigneeId: '22222222-2222-2222-2222-222222222222',
    projectId: null,
    dueAt: '۱۴۰۵/۰۸/۰۶',
    version: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_MOBILE_TICKETS: TicketDto[] = [
  {
    id: '90000000-0000-0000-0000-000000000001',
    reference: 'TKT-1042',
    title: 'عدم دسترسی به ماژول گزارش‌گیری',
    status: 'OPEN',
    priority: 'HIGH',
    accountId: '50000000-0000-0000-0000-000000000001',
    accountName: 'پتروشیمی سپهر',
    assigneeName: 'کارشناس پشتیبانی',
    targetResolutionAt: '۱۴۰۵/۰۸/۰۲ - ساعت ۱۸:۰۰',
    messagesCount: 2,
    createdAt: 'امروز ۱۰:۳۰',
    updatedAt: 'امروز ۱۱:۴۵',
  },
  {
    id: '90000000-0000-0000-0000-000000000002',
    reference: 'TKT-1041',
    title: 'درخواست وب‌هوک برای ثبت خودکار سفارشات',
    status: 'PENDING_CUSTOMER',
    priority: 'NORMAL',
    accountId: '50000000-0000-0000-0000-000000000001',
    accountName: 'فولاد گستر آریا',
    assigneeName: 'تیم فنی',
    targetResolutionAt: '۱۴۰۵/۰۸/۰۴',
    messagesCount: 1,
    createdAt: 'دیروز',
    updatedAt: 'امروز',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'tickets' | 'profile'>('tasks');
  const [tasks, setTasks] = useState<TaskSummary[]>(INITIAL_MOBILE_TASKS);
  const [tickets, setTickets] = useState<TicketDto[]>(INITIAL_MOBILE_TICKETS);
  const [taskFilter, setTaskFilter] = useState<string>('ALL');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('MEDIUM');

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<TicketPriority>('NORMAL');

  const handleTransition = (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const allowed = canTransitionTask(task.status, targetStatus, {
      canReopenDoneTask: true,
      canRestoreCanceledTask: true,
    });

    if (!allowed) {
      Alert.alert(
        'خطای دامنه',
        `انتقال مستقیم از «${statusLabel(task.status)}» به «${statusLabel(targetStatus)}» بر اساس قوانین دامنه مجاز نیست.`,
      );
      return;
    }

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: targetStatus,
          version: t.version + 1,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTasks(updated);
    Alert.alert('تغییر وضعیت موفق', `وضعیت تسک ${task.key} به ${statusLabel(targetStatus)} ارتقا یافت.`);
  };

  const handleCreateTask = () => {
    if (!newTitle.trim()) {
      Alert.alert('خطا', 'عنوان تسک الزامی است.');
      return;
    }

    const nextNum = tasks.length + 1001;
    const newTask: TaskSummary = {
      id: `m-tsk-${Date.now()}`,
      key: `TSK-${nextNum}`,
      title: newTitle.trim(),
      status: 'TODO',
      priority: newPriority,
      visibility: 'INTERNAL',
      assigneeId: '22222222-2222-2222-2222-222222222222',
      projectId: null,
      dueAt: '۱۴۰۵/۰۸/۱۲',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setIsTaskModalOpen(false);
    Alert.alert('موفقیت', `تسک جدید ${newTask.key} با موفقیت افزوده شد.`);
  };

  const handleCreateTicket = () => {
    if (!newTicketTitle.trim() || !newTicketDesc.trim()) {
      Alert.alert('خطا', 'عنوان و شرح تیکت الزامی هستند.');
      return;
    }

    const nextRef = `TKT-${tickets.length + 1043}`;
    const newTkt: TicketDto = {
      id: `m-tkt-${Date.now()}`,
      reference: nextRef,
      title: newTicketTitle.trim(),
      status: 'NEW',
      priority: newTicketPriority,
      accountId: '50000000-0000-0000-0000-000000000001',
      accountName: 'شرکت آلفا',
      assigneeName: 'در صف ارجاع',
      targetResolutionAt: '۲۴ ساعت کاری',
      messagesCount: 1,
      createdAt: 'هم‌اکنون',
      updatedAt: 'هم‌اکnow',
    };

    setTickets([newTkt, ...tickets]);
    setNewTicketTitle('');
    setNewTicketDesc('');
    setIsTicketModalOpen(false);
    Alert.alert('موفقیت', `تیکت ${nextRef} با موفقیت ثبت شد.`);
  };

  const statusLabel = (s: TaskStatus) => {
    switch (s) {
      case 'TODO': return 'در انتظار شروع';
      case 'IN_PROGRESS': return 'در حال انجام';
      case 'IN_REVIEW': return 'در انتظار بازبینی';
      case 'DONE': return 'تکمیل‌شده';
      case 'BLOCKED': return 'مسدود';
      case 'CANCELED': return 'لغوشده';
      default: return s;
    }
  };

  const priorityLabel = (p: TaskPriority | TicketPriority) => {
    switch (p) {
      case 'URGENT': return 'خیلی فوری';
      case 'HIGH': return 'بالا';
      case 'NORMAL':
      case 'MEDIUM': return 'متوسط';
      case 'LOW': return 'پایین';
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Mobile Top Header */}
      <View style={styles.header}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandMark}>C</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.headerTitle}>پلتفرم سازمانی CRM</Text>
          <Text style={styles.headerOrg}>شرکت آلفا | نقش: کارمند عملیات</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tasks' && styles.tabItemActive]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>
            کارهای من ({tasks.filter((t) => t.status !== 'DONE').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tickets' && styles.tabItemActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
            تیکت‌ها ({tickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
            اطلاعات کاربری
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.container}>
        {/* Tasks View */}
        {activeTab === 'tasks' && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionRow}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsTaskModalOpen(true)}
              >
                <Text style={styles.addButtonText}>+ تسک جدید</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>لیست وظایف</Text>
            </View>

            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['ALL', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.chip, taskFilter === st && styles.chipActive]}
                  onPress={() => setTaskFilter(st)}
                >
                  <Text style={[styles.chipText, taskFilter === st && styles.chipTextActive]}>
                    {st === 'ALL' && 'همه'}
                    {st === 'TODO' && 'در انتظار'}
                    {st === 'IN_PROGRESS' && 'جاری'}
                    {st === 'IN_REVIEW' && 'بازبینی'}
                    {st === 'DONE' && 'تکمیل'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Task Cards */}
            {filteredTasks.map((t) => (
              <View key={t.id} style={styles.taskCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.taskKey}>{t.key}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.priorityBadge}>
                      {priorityLabel(t.priority)}
                    </Text>
                    <Text style={styles.statusBadge}>{statusLabel(t.status)}</Text>
                  </View>
                </View>

                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskMeta}>سررسید: {t.dueAt ?? '—'} | نسخه: v{t.version}</Text>

                {/* Transition Action Buttons */}
                <View style={styles.actionRow}>
                  {t.status === 'TODO' && (
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => handleTransition(t.id, 'IN_PROGRESS')}
                    >
                      <Text style={styles.actionBtnTextPrimary}>شروع کار ▶</Text>
                    </TouchableOpacity>
                  )}
                  {t.status === 'IN_PROGRESS' && (
                    <TouchableOpacity
                      style={styles.actionBtnWarning}
                      onPress={() => handleTransition(t.id, 'IN_REVIEW')}
                    >
                      <Text style={styles.actionBtnTextWarning}>ارسال برای بازبینی 🔍</Text>
                    </TouchableOpacity>
                  )}
                  {t.status === 'IN_REVIEW' && (
                    <TouchableOpacity
                      style={styles.actionBtnSuccess}
                      onPress={() => handleTransition(t.id, 'DONE')}
                    >
                      <Text style={styles.actionBtnTextSuccess}>تأیید و اتمام ✓</Text>
                    </TouchableOpacity>
                  )}
                  {t.status === 'DONE' && (
                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={() => handleTransition(t.id, 'TODO')}
                    >
                      <Text style={styles.actionBtnTextSecondary}>بازگشایی ↺</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tickets View */}
        {activeTab === 'tickets' && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionRow}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#0284c7' }]}
                onPress={() => setIsTicketModalOpen(true)}
              >
                <Text style={styles.addButtonText}>+ تیکت جدید</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>تیکت‌های پشتیبانی</Text>
            </View>

            {tickets.map((t) => (
              <View key={t.id} style={styles.taskCard}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.taskKey, { color: '#0284c7', backgroundColor: '#e0f2fe' }]}>
                    {t.reference}
                  </Text>
                  <Text style={styles.priorityBadge}>{priorityLabel(t.priority)}</Text>
                </View>

                <Text style={styles.taskTitle}>{t.title}</Text>
                <Text style={styles.taskMeta}>مشتری: {t.accountName ?? 'نامشخص'}</Text>
                <Text style={styles.taskMeta}>هدف تعهد (SLA): {t.targetResolutionAt ?? '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Profile View */}
        {activeTab === 'profile' && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionTitle}>مشخصات کاربر و اتصال امن</Text>

            <View style={styles.profileCard}>
              <Text style={styles.profileLabel}>نام کاربری:</Text>
              <Text style={styles.profileVal}>کارمند عملیات سازمانی</Text>

              <Text style={styles.profileLabel}>ایمیل:</Text>
              <Text style={styles.profileVal}>employee@org-alpha.com</Text>

              <Text style={styles.profileLabel}>سازمان فعال:</Text>
              <Text style={styles.profileVal}>شرکت آلفا (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)</Text>

              <Text style={styles.profileLabel}>سطح دسترسی (RBAC):</Text>
              <Text style={styles.profileVal}>Employee (مشاهده و ویرایش وظایف سازمانی)</Text>

              <Text style={styles.profileLabel}>وضعیت اتصال:</Text>
              <Text style={[styles.profileVal, { color: '#16a34a', fontWeight: '700' }]}>
                ● آنلاین - قراردادهای مشترک با وب فعال است
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal visible={isTaskModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ایجاد وظیفه جدید</Text>

            <Text style={styles.inputLabel}>عنوان تسک (اجباری)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: بازبینی پروپوزال فنی..."
              value={newTitle}
              onChangeText={setNewTitle}
              textAlign="right"
            />

            <Text style={styles.inputLabel}>اولویت تسک</Text>
            <View style={styles.prioritySelector}>
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.pSelectBtn, newPriority === p && styles.pSelectBtnActive]}
                  onPress={() => setNewPriority(p)}
                >
                  <Text style={[styles.pSelectText, newPriority === p && styles.pSelectTextActive]}>
                    {priorityLabel(p)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsTaskModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>انصراف</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateTask}
              >
                <Text style={styles.submitBtnText}>ثبت تسک</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Ticket Modal */}
      <Modal visible={isTicketModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ثبت تیکت پشتیبانی</Text>

            <Text style={styles.inputLabel}>موضوع تیکت</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: اختلال در دسترسی به سامانه..."
              value={newTicketTitle}
              onChangeText={setNewTicketTitle}
              textAlign="right"
            />

            <Text style={styles.inputLabel}>شرح کامل</Text>
            <TextInput
              style={[styles.textInput, { height: 75 }]}
              placeholder="توضیحات و نیازمندی تیکت..."
              value={newTicketDesc}
              onChangeText={setNewTicketDesc}
              multiline
              textAlign="right"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsTicketModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>انصراف</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#0284c7' }]}
                onPress={handleCreateTicket}
              >
                <Text style={styles.submitBtnText}>ثبت درخواست</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#315be8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandMark: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  headerOrg: { fontSize: 11, color: '#64748b' },

  tabBar: {
    flexDirection: 'row-reverse',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#315be8' },
  tabText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  tabTextActive: { color: '#315be8', fontWeight: '800' },

  container: { padding: 16, gap: 14 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  addButton: {
    backgroundColor: '#315be8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  chipRow: { gap: 8, paddingBottom: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#315be8', borderColor: '#315be8' },
  chipText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  chipTextActive: { color: '#ffffff' },

  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskKey: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRow: { flexDirection: 'row', gap: 6 },
  statusBadge: {
    fontSize: 11,
    backgroundColor: '#edf1ff',
    color: '#315be8',
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadge: {
    fontSize: 11,
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', textAlign: 'right' },
  taskMeta: { fontSize: 11, color: '#64748b', textAlign: 'right' },

  actionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  actionBtnPrimary: {
    backgroundColor: '#315be8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnTextPrimary: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  actionBtnWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#d97706',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnTextWarning: { color: '#d97706', fontSize: 11, fontWeight: '700' },
  actionBtnSuccess: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnTextSuccess: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  actionBtnSecondary: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnTextSecondary: { color: '#475569', fontSize: 11, fontWeight: '600' },

  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 6,
  },
  profileLabel: { fontSize: 12, color: '#64748b', textAlign: 'right' },
  profileVal: { fontSize: 13, color: '#0f172a', fontWeight: '600', textAlign: 'right', marginBottom: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', textAlign: 'right', marginBottom: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569', textAlign: 'right' },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  prioritySelector: { flexDirection: 'row-reverse', gap: 6 },
  pSelectBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
  },
  pSelectBtnActive: { backgroundColor: '#315be8', borderColor: '#315be8' },
  pSelectText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  pSelectTextActive: { color: '#ffffff' },

  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  cancelBtnText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  submitBtn: { backgroundColor: '#315be8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
