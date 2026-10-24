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
import type { TicketPriority } from '@crm/contracts';
import { getTicketPriorityCfg } from '../lib/constants';

export interface CreateTicketFormData {
  title: string;
  accountName?: string;
  priority: TicketPriority;
  description: string;
}

export interface CreateTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketFormData) => void;
}

const PRIORITIES: readonly TicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [account, setAccount] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('NORMAL');
  const [description, setDescription] = useState('');

  const handleClose = () => {
    setTitle('');
    setAccount('');
    setPriority('NORMAL');
    setDescription('');
    onClose();
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      Alert.alert('خطا در اعتبارسنجی', 'لطفاً موضوع و عنوان تیکت را وارد نمایید.', [
        { text: 'بازگشت', style: 'cancel' },
      ]);
      return;
    }

    if (!trimmedDesc) {
      Alert.alert('خطا در اعتبارسنجی', 'لطفاً شرح کامل درخواست را مرقوم فرمایید.', [
        { text: 'بازگشت', style: 'cancel' },
      ]);
      return;
    }

    onSubmit({
      title: trimmedTitle,
      accountName: account.trim() || undefined,
      priority,
      description: trimmedDesc,
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
            <Text style={styles.modalHeaderTitle}>ثبت تیکت پشتیبانی جدید</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formItem}>
              <Text style={styles.formItemLabel}>موضوع تیکت *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="مثلاً: خطای دسترسی به گزارشات فصلی"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                textAlign="right"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formItemLabel}>نام مشتری یا شرکت کارفرما</Text>
              <TextInput
                style={styles.formInput}
                placeholder="مثلاً: پتروشیمی زاگرس"
                placeholderTextColor="#94A3B8"
                value={account}
                onChangeText={setAccount}
                textAlign="right"
              />
            </View>

            <View style={styles.formItem}>
              <Text style={styles.formItemLabel}>اولویت رسیدگی (SLA)</Text>
              <View style={styles.prioritySelectorRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p;
                  const pCfg = getTicketPriorityCfg(p);
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

            <View style={styles.formItem}>
              <Text style={styles.formItemLabel}>شرح کامل درخواست و جزییات خطا *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="توضیحات و شرایط وقوع مشکل را با جزییات شرح دهید..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalSubmitButton, { backgroundColor: '#0284C7' }]}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSubmitButtonText}>ثبت و ارسال تیکت</Text>
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
  formTextArea: {
    height: 80,
    paddingTop: 8,
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
