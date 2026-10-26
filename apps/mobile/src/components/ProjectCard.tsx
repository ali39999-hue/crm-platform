import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProjectHealth, ProjectStatus, ProjectSummaryDto } from '@crm/contracts';

interface ProjectCardProps {
  project: ProjectSummaryDto;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getHealthBadge = (health: ProjectHealth) => {
    switch (health) {
      case 'ON_TRACK':
        return { label: '🟢 طبق برنامه', color: '#067647', bg: '#ECFDF3' };
      case 'AT_RISK':
        return { label: '🟡 در معرض ریسک', color: '#B54708', bg: '#FEF0C7' };
      case 'OFF_TRACK':
        return { label: '🔴 نیازمند مداخله', color: '#B42318', bg: '#FEE4E2' };
      default:
        return { label: health, color: '#475467', bg: '#F2F4F7' };
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'در حال اجرا';
      case 'PLANNING':
        return 'برنامه‌ریزی';
      case 'COMPLETED':
        return 'تکمیل‌شده';
      case 'ON_HOLD':
        return 'متوقف‌شده';
      default:
        return status;
    }
  };

  const healthCfg = getHealthBadge(project.health);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.keyText}>{project.key}</Text>
        <View style={[styles.badge, { backgroundColor: healthCfg.bg }]}>
          <Text style={[styles.badgeText, { color: healthCfg.color }]}>{healthCfg.label}</Text>
        </View>
      </View>

      <Text style={styles.title}>{project.name}</Text>
      {project.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {project.description}
        </Text>
      ) : null}

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressText}>پیشرفت فازها</Text>
          <Text style={styles.progressValue}>{project.progressPercent}٪</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.max(project.progressPercent, 5)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>وضعیت: {getStatusLabel(project.status)}</Text>
        <Text style={styles.footerText}>
          {project.milestonesCount} مایل‌استون • موعد: {project.targetDate || '۱۴۰۵/۰۹/۳۰'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E8EF',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  keyText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#6938EF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'right',
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    color: '#667085',
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#667085',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#101828',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F2F4F7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6938EF',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
    marginTop: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#667085',
  },
});
