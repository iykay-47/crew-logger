// New Entry — log a completed run. See features/new-entry.md.
//
// Creates one shared `jobs` record via POST /entries. The record describes
// the run, not the person entering it; crew membership and per-person claims
// are separate and not part of this form.

import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import FormField from '@/components/FormField';
import { Text, View } from '@/components/Themed';
import { createEntry } from '@/services/entries';
import type { JobCreatePayload } from '@/types';
import { buildTimestamps, durationMinutes, isValidDate } from '@/utils/datetime';
import { formatMinutes } from '@/utils/format';

/** Until auth exists (Phase 2), the client must say who this is. It lives in
 *  config rather than on the form — a crew member shouldn't retype their
 *  employee number for every run. */
const EMPLOYEE_NUMBER =
  (Constants.expoConfig?.extra?.employeeNumber as string | undefined) ?? '';

const EMPTY = {
  train_id: '',
  record_date: new Date().toISOString().slice(0, 10), // defaults to today
  origin_station: '',
  final_station: '',
  on_duty: '',
  start_time: '',
  initial_os: '',
  final_os: '',
  off_duty: '',
  run_miles: '',
  train_length: '',
  cars: '',
  original_train_id: '',
};

/** Blank means "not recorded" — null, never 0 or "". Zero is a real
 *  measurement; 22 of the 74 historic records have a genuinely blank `cars`. */
const textOrNull = (value: string): string | null => value.trim() || null;

const numberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function NewEntryScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  // Live feedback so a midnight-rollover mistake is visible before
  // submitting. Display only — the database computes the real work_minutes.
  const duration = useMemo(() => {
    if (!isValidDate(form.record_date)) return null;
    const times = buildTimestamps(form.record_date, form);
    return durationMinutes(times.on_duty, times.off_duty);
  }, [form]);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.train_id.trim()) errors.train_id = 'Required';
    if (!isValidDate(form.record_date)) errors.record_date = 'Use YYYY-MM-DD';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit() {
    setError(null);
    if (!validate()) return;

    if (!EMPLOYEE_NUMBER) {
      setError('No employee number configured (app.json → extra.employeeNumber).');
      return;
    }

    const times = buildTimestamps(form.record_date, form);

    // Exactly the fields JobCreate accepts. Anything else is silently
    // discarded by the API, so a stray key would vanish without an error.
    const payload: JobCreatePayload = {
      train_id: form.train_id.trim(),
      record_date: form.record_date.trim(),
      edited_by: EMPLOYEE_NUMBER,
      original_train_id: textOrNull(form.original_train_id),
      origin_station: textOrNull(form.origin_station),
      final_station: textOrNull(form.final_station),
      on_duty: times.on_duty,
      start_time: times.start_time,
      initial_os: times.initial_os,
      final_os: times.final_os,
      off_duty: times.off_duty,
      run_miles: numberOrNull(form.run_miles),
      train_length: numberOrNull(form.train_length),
      cars: numberOrNull(form.cars),
    };

    setSubmitting(true);
    try {
      await createEntry(payload);
      setForm({ ...EMPTY });
      setFieldErrors({});
      router.push('/history');
    } catch (e) {
      // Keep everything the user typed — retyping a whole run is punishing.
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <Text style={styles.heading}>Run</Text>
      <FormField
        label="Train"
        required
        value={form.train_id}
        onChangeText={set('train_id')}
        placeholder="A44251-22"
        error={fieldErrors.train_id}
      />
      <FormField
        label="Date"
        required
        value={form.record_date}
        onChangeText={set('record_date')}
        hint="YYYY-MM-DD"
        error={fieldErrors.record_date}
      />

      <Text style={styles.heading}>Route</Text>
      <FormField
        label="From"
        value={form.origin_station}
        onChangeText={set('origin_station')}
        placeholder="81918"
      />
      <FormField
        label="To"
        value={form.final_station}
        onChangeText={set('final_station')}
        placeholder="81716"
      />

      <Text style={styles.heading}>Times</Text>
      <Text style={styles.note}>
        24-hour clock. Times after midnight roll to the next day automatically.
      </Text>
      <FormField label="On duty" value={form.on_duty} onChangeText={set('on_duty')} hint="HH:MM" placeholder="15:15" />
      <FormField label="Start" value={form.start_time} onChangeText={set('start_time')} hint="HH:MM" placeholder="15:30" />
      <FormField label="Initial OS" value={form.initial_os} onChangeText={set('initial_os')} hint="HH:MM" />
      <FormField label="Final OS" value={form.final_os} onChangeText={set('final_os')} hint="HH:MM" />
      <FormField label="Off duty" value={form.off_duty} onChangeText={set('off_duty')} hint="HH:MM" placeholder="22:45" />

      {duration !== null ? (
        <View style={styles.duration}>
          <Text style={styles.durationLabel}>Time worked</Text>
          <Text style={[styles.durationValue, duration < 0 ? styles.negative : null]}>
            {duration < 0 ? 'Off duty is before on duty' : formatMinutes(duration)}
          </Text>
        </View>
      ) : null}

      <Text style={styles.heading}>Details</Text>
      <FormField label="Miles" value={form.run_miles} onChangeText={set('run_miles')} keyboardType="decimal-pad" placeholder="112.72" />
      <FormField label="Train length" value={form.train_length} onChangeText={set('train_length')} keyboardType="number-pad" hint="feet" />
      <FormField label="Cars" value={form.cars} onChangeText={set('cars')} keyboardType="number-pad" />
      <FormField label="Original train" value={form.original_train_id} onChangeText={set('original_train_id')} hint="only if re-designated" />

      <Pressable
        onPress={onSubmit}
        disabled={submitting}
        style={[styles.submit, submitting ? styles.submitDisabled : null]}>
        <Text style={styles.submitText}>
          {submitting ? 'Saving…' : 'Save entry'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, maxWidth: 560, width: '100%', alignSelf: 'center' },
  heading: {
    fontSize: 13, fontWeight: '600', opacity: 0.5, marginTop: 18, marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  note: { fontSize: 12, opacity: 0.5, marginBottom: 10 },
  banner: {
    borderWidth: 1, borderColor: '#d9534f', borderRadius: 6,
    padding: 12, marginBottom: 12, backgroundColor: 'transparent',
  },
  bannerText: { color: '#d9534f', fontSize: 13 },
  duration: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#8888', backgroundColor: 'transparent',
  },
  durationLabel: { fontSize: 13, opacity: 0.6 },
  durationValue: { fontSize: 16, fontWeight: '600' },
  negative: { color: '#d9534f', fontSize: 13, fontWeight: '400' },
  submit: {
    marginTop: 24, paddingVertical: 14, borderRadius: 8,
    backgroundColor: '#2f95dc', alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
