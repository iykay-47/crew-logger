// Dashboard — summary totals. See features/dashboard.md.
//
// Every figure here is computed by the backend. This screen fetches and
// formats; it does no arithmetic of its own.

import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { ErrorState, Loading } from '@/components/ScreenState';
import StatTile from '@/components/StatTile';
import { Text, View } from '@/components/Themed';
import { getMonthly, getSummary, getWeekly } from '@/services/reports';
import type { ReportPeriod } from '@/types';
import { formatHours, formatMiles, formatMinutes, formatMonth } from '@/utils/format';

export default function DashboardScreen() {
  const [summary, setSummary] = useState<ReportPeriod | null>(null);
  const [weekly, setWeekly] = useState<ReportPeriod | null>(null);
  const [monthly, setMonthly] = useState<ReportPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [summaryData, weeklyData, monthlyData] = await Promise.all([
        getSummary(),
        getWeekly(),
        getMonthly(),
      ]);
      setSummary(summaryData);
      setWeekly(weeklyData);
      setMonthly(monthlyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  // Most recent month first for display; the API returns oldest first.
  const monthsNewestFirst = [...monthly].reverse();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <Text style={styles.heading}>All time</Text>
      <View style={styles.tiles}>
        <StatTile label="Trips" value={summary?.job_count ?? 0} />
        <StatTile label="Worked" value={formatHours(summary?.total_work_minutes ?? 0)} unit="hrs" />
        <StatTile label="Distance" value={formatMiles(summary?.total_miles ?? 0)} unit="mi" />
      </View>

      <Text style={styles.heading}>This week</Text>
      <View style={styles.tiles}>
        <StatTile label="Trips" value={weekly?.job_count ?? 0} />
        <StatTile label="Worked" value={formatMinutes(weekly?.total_work_minutes ?? 0)} />
        <StatTile label="Distance" value={formatMiles(weekly?.total_miles ?? 0)} unit="mi" />
      </View>

      <Text style={styles.heading}>By month</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cell, styles.cellMonth, styles.headerText]}>Month</Text>
          <Text style={[styles.cell, styles.headerText]}>Trips</Text>
          <Text style={[styles.cell, styles.headerText]}>Hours</Text>
          <Text style={[styles.cell, styles.headerText]}>Miles</Text>
        </View>
        {monthsNewestFirst.map((month) => (
          <View key={month.period} style={styles.tableRow}>
            <Text style={[styles.cell, styles.cellMonth]}>{formatMonth(month.period)}</Text>
            <Text style={styles.cell}>{month.job_count}</Text>
            <Text style={styles.cell}>{formatHours(month.total_work_minutes)}</Text>
            <Text style={styles.cell}>{formatMiles(month.total_miles)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 13, fontWeight: '600', opacity: 0.5, marginTop: 20, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  tiles: { flexDirection: 'row', gap: 8, backgroundColor: 'transparent' },
  table: { marginTop: 4, backgroundColor: 'transparent' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8888',
    backgroundColor: 'transparent',
  },
  tableHeader: { borderBottomWidth: 1 },
  headerText: { fontSize: 12, opacity: 0.5, fontWeight: '600' },
  cell: { flex: 1, fontSize: 14, textAlign: 'right' },
  cellMonth: { flex: 2, textAlign: 'left' },
});
