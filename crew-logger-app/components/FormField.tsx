// A labelled text input. Used for every field on the entry form so the
// layout and error styling stay consistent.

import { StyleSheet, TextInput, type KeyboardTypeOptions } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useThemeColor } from '@/components/Themed';

export default function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  required,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  keyboardType?: KeyboardTypeOptions;
}) {
  const color = useThemeColor({}, 'text');

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
        {hint ? <Text style={styles.hint}>  {hint}</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8888"
        keyboardType={keyboardType}
        autoCapitalize="characters"
        autoCorrect={false}
        style={[styles.input, { color }, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14, backgroundColor: 'transparent' },
  label: { fontSize: 13, marginBottom: 4, opacity: 0.8 },
  required: { color: '#d9534f' },
  hint: { fontSize: 11, opacity: 0.5 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8888',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputError: { borderColor: '#d9534f', borderWidth: 1 },
  error: { fontSize: 12, color: '#d9534f', marginTop: 4 },
});
