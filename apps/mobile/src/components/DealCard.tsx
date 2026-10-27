import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DealDto } from '@crm/contracts';
import { DEAL_STAGE_CONFIG } from '../lib/constants';

interface DealCardProps {
  deal: DealDto;
  onAdvanceStage?: (deal: DealDto) => void;
  onMarkLost?: (deal: DealDto) => void;
}

export function DealCard({ deal, onAdvanceStage, onMarkLost }: DealCardProps) {
  const stageCfg = DEAL_STAGE_CONFIG[deal.stage] || {
    label: deal.stage,
    color: '#475467',
    bg: '#F2F4F7',
    borderColor: '#D0D5DD',
  };

  const isRotting =
    deal.isRotting || (deal.daysInCurrentStage !== undefined && deal.daysInCurrentStage >= 14);

  const formatRials = (minor?: number | null) => {
    if (minor === undefined || minor === null) return 'مبلغ نامشخص';
    return (minor / 1000000).toLocaleString('fa-IR') + ' م.ر';
  };

  return (
    <View style={[styles.card, isRotting && styles.cardRotting]}>
      {/* Header with Stage and Rotting Indicator */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: stageCfg.bg, borderColor: stageCfg.borderColor }]}>
          <Text style={[styles.badgeText, { color: stageCfg.color }]}>{stageCfg.label}</Text>
        </View>

        {isRotting ? (
          <View style={styles.rottingBadge}>
            <Text style={styles.rottingText}>
              ⚠️ راکد ({deal.daysInCurrentStage || 14} روز)
            </Text>
          </View>
        ) : (
          <Text style={styles.probabilityText}>{deal.probability ?? 50}٪ احتمال</Text>
        )}
      </View>

      {/* Deal Name */}
      <Text style={styles.title} numberOfLines={2}>
        {deal.name}
      </Text>

      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>ارزش معامله:</Text>
        <Text style={styles.amountValue}>{formatRials(deal.amountMinor)}</Text>
      </View>

      {/* Didar Next Action Discipline */}
      {deal.nextActionTitle ? (
        <View style={styles.nextActionContainer}>
          <Text style={styles.nextActionIcon}>📋</Text>
          <View style={styles.nextActionTextCol}>
            <Text style={styles.nextActionTitle} numberOfLines={1}>
              {deal.nextActionTitle}
            </Text>
            {deal.nextActionDueAt ? (
              <Text style={styles.nextActionDue}>
                موعد: {new Date(deal.nextActionDueAt).toLocaleDateString('fa-IR')}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.missingActionContainer}>
          <Text style={styles.missingActionText}>⚠️ بدون اقدام بعدی (نیازمند برنامه‌ریزی)</Text>
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.actionsRow}>
        {deal.stage !== 'WON' && deal.stage !== 'LOST' && (
          <>
            <TouchableOpacity
              style={styles.advanceBtn}
              onPress={() => onAdvanceStage?.(deal)}
              activeOpacity={0.8}
            >
              <Text style={styles.advanceBtnText}>پیشروی کاریز ▶</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.lostBtn}
              onPress={() => onMarkLost?.(deal)}
              activeOpacity={0.8}
            >
              <Text style={styles.lostBtnText}>ثبت باخت ✕</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E4E8EF',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRotting: {
    borderColor: '#F79009',
    backgroundColor: '#FFFAEB',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rottingBadge: {
    backgroundColor: '#FEE4E2',
    borderColor: '#FECDCA',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rottingText: {
    color: '#B42318',
    fontSize: 10,
    fontWeight: '700',
  },
  probabilityText: {
    fontSize: 11,
    color: '#667085',
    fontWeight: '600',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101828',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 20,
  },
  amountRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  amountLabel: {
    fontSize: 12,
    color: '#475467',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#067647',
    fontFamily: 'monospace',
  },
  nextActionContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#EFF8FF',
    borderColor: '#B2DDFF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    gap: 6,
  },
  nextActionIcon: {
    fontSize: 14,
  },
  nextActionTextCol: {
    flex: 1,
  },
  nextActionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#175CD3',
    textAlign: 'right',
  },
  nextActionDue: {
    fontSize: 10,
    color: '#2E90FA',
    textAlign: 'right',
    marginTop: 1,
  },
  missingActionContainer: {
    backgroundColor: '#FEF0C7',
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
  },
  missingActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B54708',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  advanceBtn: {
    flex: 2,
    backgroundColor: '#1570EF',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  advanceBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  lostBtn: {
    flex: 1,
    backgroundColor: '#FEE4E2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  lostBtnText: {
    color: '#B42318',
    fontSize: 11,
    fontWeight: '700',
  },
});
