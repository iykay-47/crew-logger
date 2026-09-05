// Displays a single job entry in a list. See features/history.md.

import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import type { Job } from '@/types';
import { formatDate, formatMiles, formatMinutes, formatTime } from '@/utils/format';

export default function EntryCard({ job }: { job: Job }) {
  const route =
    job.origin_station && job.final_station
      ? `${job.origin_station} → ${job.final_station}`
      : '—';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.train}>{job.train_id}</Text>
        <Text style={styles.date}>{formatDate(job.record_date)}</Text>
      </View>

      <Text style={styles.route}>{route}</Text>

      <View style={styles.row}>
        <Text style={styles.detail}>
          {formatTime(job.on_duty)} – {formatTime(job.off_duty)}
        </Text>
        <Text style={styles.detail}>{formatMinutes(job.work_minutes)}</Text>
        <Text style={styles.detail}>{formatMiles(job.run_miles)} mi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#8888',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  train: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 14, opacity: 0.6 },
  route: { fontSize: 14, opacity: 0.8, marginTop: 2, marginBottom: 6 },
  detail: { fontSize: 13, opacity: 0.7 },
});
