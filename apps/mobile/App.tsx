import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

const rows = [
  { title: 'کارهای من', description: 'وظایف واگذارشده و مهلت‌های نزدیک' },
  { title: 'مشتریان', description: 'جست‌وجوی شرکت و مخاطب مجاز' },
  { title: 'درخواست‌ها', description: 'پیگیری تیکت‌های مجاز' },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>فضای کاری سازمان</Text>
        <Text style={styles.title}>کارهای امروز</Text>
        <Text style={styles.subtitle}>اسکلت اولیه اپ موبایل CRM</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>اتصال API هنوز فعال نیست</Text>
          <Text style={styles.noticeBody}>داده واقعی، ورود امن، push notification و offline mode باید طبق رودمپ اضافه شوند.</Text>
        </View>
        {rows.map((row) => (
          <View key={row.title} style={styles.card}>
            <Text style={styles.cardTitle}>{row.title}</Text>
            <Text style={styles.cardBody}>{row.description}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fa' },
  container: { padding: 20, paddingTop: 34, gap: 13 },
  eyebrow: { color: '#667085', fontSize: 12, textAlign: 'right' },
  title: { color: '#17202f', fontSize: 28, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: '#667085', fontSize: 14, textAlign: 'right', marginBottom: 12 },
  notice: { backgroundColor: '#fff8e7', borderColor: '#ead5a0', borderWidth: 1, borderRadius: 14, padding: 16, gap: 7 },
  noticeTitle: { color: '#75550c', fontSize: 14, fontWeight: '700', textAlign: 'right' },
  noticeBody: { color: '#75550c', fontSize: 12, lineHeight: 20, textAlign: 'right' },
  card: { backgroundColor: 'white', borderColor: '#e4e8ef', borderWidth: 1, borderRadius: 15, padding: 19, gap: 7 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#17202f', textAlign: 'right' },
  cardBody: { fontSize: 13, lineHeight: 21, color: '#667085', textAlign: 'right' },
});
