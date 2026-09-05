// History — every job record, newest first. See features/history.md.

import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import EntryCard from '@/components/EntryCard';
import { Empty, ErrorState, Loading } from '@/components/ScreenState';
import { View } from '@/components/Themed';
import { getEntries } from '@/services/entries';
import type { Job } from '@/types';

export default function HistoryScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setJobs(await getEntries());
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
  if (jobs.length === 0) return <Empty message="No trips recorded yet." />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={jobs}
        keyExtractor={(job) => job.job_id}
        renderItem={({ item }) => <EntryCard job={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
