import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TaskStatus, TaskSummary } from '@crm/contracts';
import { canTransitionTask } from '@crm/domain';
import {
  ACTOR_CAPABILITIES,
  ALL_TASK_STATUSES,
  getTaskPriorityCfg,
  getTaskStatusCfg,
  getTransitionButtonText,
} from '../lib/constants';

export interface TaskCardProps {
  task: TaskSummary;
  onTransition: (task: TaskSummary, targetStatus: TaskStatus) => void;
  onTestInvalidTransition?: (task: TaskSummary) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTransition,
  onTestInvalidTransition,
}) => {
  const statusCfg = getTaskStatusCfg(task.status);
  const priorityCfg = getTaskPriorityCfg(task.priority);

  // Compute transitions strictly allowed by domain rules
  const availableTransitions = ALL_TASK_STATUSES.filter((target) =>
    canTransitionTask(task.status, target, ACTOR_CAPABILITIES),
  );

  return (
    <View style={styles.itemCard}>
      {/* Header Row: Key & Badges */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.badgesCluster}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: statusCfg.bg,
                borderColor: statusCfg.borderColor,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: priorityCfg.bg, borderColor: priorityCfg.bg },
            ]}
          >
            <Text style={[styles.badgeText, { color: priorityCfg.color }]}>
              {priorityCfg.label}
            </Text>
          </View>
        </View>
        <Text style={styles.taskKeyBadge}>{task.key}</Text>
      </View>

      {/* Task Title */}
      <Text style={styles.itemTitle}>{task.title}</Text>

      {/* Metadata Box */}
      <View style={styles.metadataBox}>
        {task.dueAt && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>مهلت:</Text>
            <Text style={styles.metaValue}>{task.dueAt}</Text>
          </View>
        )}
        {task.projectName && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>پروژه:</Text>
            <Text style={styles.metaValue}>{task.projectName}</Text>
          </View>
        )}
        {task.assigneeName && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>مسئول:</Text>
            <Text style={styles.metaValue}>{task.assigneeName}</Text>
          </View>
        )}
      </View>

      {/* Version & Update Time */}
      <View style={styles.metaFooterRow}>
        <Text style={styles.versionTag}>نسخه: v{task.version}</Text>
        <Text style={styles.updatedAtTag}>بروزرسانی: {task.updatedAt}</Text>
      </View>

      <View style={styles.cardDivider} />

      {/* Quick Transitions Section */}
      <View style={styles.transitionSection}>
        <Text style={styles.transitionPrompt}>گردش کار و تغییر وضعیت:</Text>

        {availableTransitions.length > 0 ? (
          <View style={styles.actionButtonWrap}>
            {availableTransitions.map((target) => {
              const btnLabel = getTransitionButtonText(task.status, target);
              const targetCfg = getTaskStatusCfg(target);
              return (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.quickTransitionButton,
                    { borderColor: targetCfg.borderColor },
                  ]}
                  onPress={() => onTransition(task, target)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickTransitionButtonText,
                      { color: targetCfg.color },
                    ]}
                  >
                    {btnLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.noTransitionNote}>وظیفه در وضعیت نهایی است.</Text>
        )}

        {/* Test domain rule rejection */}
        {onTestInvalidTransition && (
          <TouchableOpacity
            style={styles.testDomainButton}
            onPress={() => onTestInvalidTransition(task)}
            activeOpacity={0.7}
          >
            <Text style={styles.testDomainButtonText}>
              تست قانون محدودیت دامنه (رد انتقال غیرمجاز)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskKeyBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgesCluster: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metadataBox: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
    writingDirection: 'rtl',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    writingDirection: 'rtl',
  },
  metaFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionTag: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  updatedAtTag: {
    fontSize: 11,
    color: '#94A3B8',
    writingDirection: 'rtl',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  transitionSection: {
    gap: 6,
  },
  transitionPrompt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionButtonWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickTransitionButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickTransitionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  noTransitionNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontStyle: 'italic',
  },
  testDomainButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  testDomainButtonText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
});
