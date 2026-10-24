import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TaskPriority } from '@crm/contracts';
import { getTaskPriorityCfg } from '../lib/constants';

export interface CreateTaskFormData {
  title: string;
  projectName?: string;
  priority: TaskPriority;
}

export interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => void;
}

const PRIORITIES: readonly TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');

  const handleClose = () => {
    setTitle('');
    setProject('');
    setPriority('MEDIUM');
    onClose();
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('خطا در اعتبارسنجی', 'لطفاً عنوان تسک را وارد فرمایید.', [
        { text: 'بازگشت', style: 'cancel' },
      ]);
      return;
    }

    onSubmit({
      title: trimmedTitle,
      projectName: project.trim() || undefined,
      priority,
    });

    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>تعریف وظیفه جدید</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formItem}>
              <Text style={styles.formItemLabel}>عنوان وظیفه *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="مثلاً: بررسی نیازمندی‌های ماژول انبارداری..."
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                textAlign="right"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formItemLabel}>نام پروژه یا موضوع</Text>
              <TextInput
                style={styles.formInput}
                placeholder="مثلاً: سامانه مدیریت مالی..."
                placeholderTextColor="#94A3B8"
                value={project}
                onChangeText={setProject}
                textAlign="right"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formItemLabel}>اولویت وظیفه</Text>
              <View style={styles.prioritySelectorRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p;
                  const pCfg = getTaskPriorityCfg(p);
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityChipBtn,
                        isSelected && {
                          backgroundColor: pCfg.bg,
                          borderColor: pCfg.color,
                        },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text
                        style={[
                          styles.priorityChipBtnText,
                          isSelected && { color: pCfg.color, fontWeight: '700' },
                        ]}
                      >
                        {pCfg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitButtonText}>ثبت و ایجاد وظیفه</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleClose}
              >
                <Text style={styles.modalCancelButtonText}>انصراف</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formItem: {
    marginBottom: 12,
    gap: 5,
  },
  formItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    writingDirection: 'rtl',
  },
  prioritySelectorRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  priorityChipBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  priorityChipBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    writingDirection: 'rtl',
  },
  modalButtonRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  modalSubmitButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
});
