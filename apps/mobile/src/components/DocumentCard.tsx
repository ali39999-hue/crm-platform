import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DocumentSummaryDto, DocumentVisibility } from '@crm/contracts';

interface DocumentCardProps {
  document: DocumentSummaryDto;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const getVisibilityLabel = (vis: DocumentVisibility) => {
    switch (vis) {
      case 'WORKSPACE':
        return { label: 'سازمانی', color: '#175CD3', bg: '#EFF8FF' };
      case 'CUSTOMER_VISIBLE':
        return { label: 'پورتال مشتری', color: '#067647', bg: '#ECFDF3' };
      case 'TEAM':
        return { label: 'تیمی', color: '#B54708', bg: '#FEF0C7' };
      case 'PRIVATE':
        return { label: 'خصوصی', color: '#B42318', bg: '#FEE4E2' };
      default:
        return { label: vis, color: '#475467', bg: '#F2F4F7' };
    }
  };

  const visCfg = getVisibilityLabel(document.visibility);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.tagsRow}>
          <View style={[styles.badge, { backgroundColor: visCfg.bg }]}>
            <Text style={[styles.badgeText, { color: visCfg.color }]}>{visCfg.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#F2F4F7' }]}>
            <Text style={[styles.badgeText, { color: '#344054' }]}>نسخه {document.version}</Text>
          </View>
        </View>
        <Text style={styles.spaceText}>{document.spaceName || 'پایگاه دانش'}</Text>
      </View>

      <Text style={styles.title}>{document.title}</Text>

      {document.tags && document.tags.length > 0 ? (
        <View style={styles.tagsContainer}>
          {document.tags.map((t) => (
            <Text key={t} style={styles.tagText}>
              #{t}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>نویسنده: {document.authorName}</Text>
        <Text style={styles.footerText}>{document.updatedAt}</Text>
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
  tagsRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  spaceText: {
    fontSize: 11,
    color: '#6938EF',
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
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
    marginBottom: 8,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagText: {
    fontSize: 10,
    color: '#667085',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F4F7',
  },
  footerText: {
    fontSize: 11,
    color: '#98A2B3',
  },
});
