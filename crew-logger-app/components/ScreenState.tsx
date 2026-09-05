// Loading and error states, shared by every data-backed screen.
//
// An unreachable API is the most likely failure in practice, so it gets a
// real message and a retry rather than a blank screen.

import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export function Loading() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator />
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>Couldn&apos;t load data</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onRetry} style={styles.retry}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  message: { fontSize: 14, opacity: 0.7, textAlign: 'center' },
  retry: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8888',
    borderRadius: 6,
  },
  retryText: { fontSize: 14 },
});
