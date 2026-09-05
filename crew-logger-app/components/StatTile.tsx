// A single labelled figure. Used across the dashboard's summary rows.

import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function StatTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, paddingVertical: 12, backgroundColor: 'transparent' },
  value: { fontSize: 24, fontWeight: '600' },
  unit: { fontSize: 14, fontWeight: '400', opacity: 0.6 },
  label: { fontSize: 12, opacity: 0.6, marginTop: 2 },
});
