import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { TicketDto } from '@crm/contracts';
import {
  getTicketPriorityCfg,
  getTicketStatusCfg,
} from '../lib/constants';

export interface TicketCardProps {
  ticket: TicketDto;
  onToggleStatus: (ticket: TicketDto) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onToggleStatus,
}) => {
  const statusCfg = getTicketStatusCfg(ticket.status);
  const priorityCfg = getTicketPriorityCfg(ticket.priority);
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

  return (
    <View style={styles.itemCard}>
      {/* Header Row: Reference & Badges */}
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
        <Text style={styles.ticketRefBadge}>{ticket.reference}</Text>
      </View>

      {/* Title */}
      <Text style={styles.itemTitle}>{ticket.title}</Text>

      {/* Account & Details Box */}
      <View style={styles.metadataBox}>
        {ticket.accountName && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>مشتری:</Text>
            <Text style={styles.metaValue}>{ticket.accountName}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>پیام‌ها:</Text>
          <Text style={styles.metaValue}>💬 {ticket.messagesCount} پیام</Text>
        </View>
        {ticket.assigneeName && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>مسئول:</Text>
            <Text style={styles.metaValue}>{ticket.assigneeName}</Text>
          </View>
        )}
        {ticket.targetResolutionAt && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>هدف حل (SLA):</Text>
            <Text style={styles.metaValue}>{ticket.targetResolutionAt}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardDivider} />

      {/* Footer Row: Status Action & Date */}
      <View style={styles.ticketFooterRow}>
        <Text style={styles.updatedAtTag}>{ticket.createdAt}</Text>

        <TouchableOpacity
          style={[
            styles.ticketStatusBtn,
            isResolved ? styles.reopenTicketBtn : styles.resolveTicketBtn,
          ]}
          onPress={() => onToggleStatus(ticket)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ticketStatusBtnText,
              isResolved ? styles.reopenTicketBtnText : styles.resolveTicketBtnText,
            ]}
          >
            {isResolved ? 'بازگشایی مجدد تیکت ↺' : 'تغییر به حل‌شده ✓'}
          </Text>
        </TouchableOpacity>
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
  ticketRefBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#E0F2FE',
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
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updatedAtTag: {
    fontSize: 11,
    color: '#94A3B8',
    writingDirection: 'rtl',
  },
  ticketStatusBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  resolveTicketBtn: {
    backgroundColor: '#ECFDF3',
    borderColor: '#A6F4C5',
  },
  resolveTicketBtnText: {
    color: '#027A48',
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  reopenTicketBtn: {
    backgroundColor: '#EFF8FF',
    borderColor: '#B2DDFF',
  },
  reopenTicketBtnText: {
    color: '#175CD3',
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  ticketStatusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});
