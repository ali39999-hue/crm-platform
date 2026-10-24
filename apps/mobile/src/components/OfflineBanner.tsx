import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface OfflineBannerProps {
  isOffline: boolean;
  pendingCount: number;
  isSyncing?: boolean;
  onToggleNetwork: () => void;
  onSync: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  pendingCount,
  isSyncing = false,
  onToggleNetwork,
  onSync,
}) => {
  return (
    <View style={styles.container}>
      {/* Header Top Network Status Toggle */}
      <View style={styles.networkStatusRow}>
        <TouchableOpacity
          style={[styles.networkBadge, isOffline ? styles.offlineBadge : styles.onlineBadge]}
          onPress={onToggleNetwork}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.networkDot,
              { backgroundColor: isOffline ? '#D97706' : '#16A34A' },
            ]}
          />
          <Text
            style={[
              styles.networkText,
              { color: isOffline ? '#92400E' : '#166534' },
            ]}
          >
            {isOffline ? 'آفلاین (محلی)' : 'آنلاین'}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.eyebrow}>فضای کاری سازمان CRM</Text>
          <Text style={styles.appTitle}>سامانه همراه پیشگامان</Text>
        </View>
      </View>

      {/* Offline Alert or Pending Queue Banner */}
      {(isOffline || pendingCount > 0) && (
        <View
          style={[
            styles.bannerBox,
            isOffline ? styles.bannerOffline : styles.bannerPendingOnly,
          ]}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              {isOffline
                ? '⚡ حالت کاری آفلاین فعال است'
                : '🔄 تغییرات محلی آماده همگام‌سازی'}
            </Text>
            <Text style={styles.bannerDesc}>
              {isOffline
                ? 'تغییرات به صورت پایدار در صف محلی ذخیره می‌شوند.'
                : 'اتصال اینترنت برقرار است. می‌توانید صف را ارسال فرمایید.'}
              {pendingCount > 0
                ? ` (${pendingCount} عملیات در صف)`
                : ' (صف همگام‌سازی خالی است)'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.syncButton,
              isSyncing && styles.syncButtonDisabled,
            ]}
            onPress={onSync}
            disabled={isSyncing}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.syncButtonText}>همگام‌سازی</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  networkStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitles: {
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  appTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  onlineBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  offlineBadge: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  bannerBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bannerOffline: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  bannerPendingOnly: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  bannerContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bannerTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bannerDesc: {
    color: '#B45309',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#D97706',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
});
