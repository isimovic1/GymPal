import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { SetEntry } from '../lib/types';
import { accent, colors } from '../theme';

export const fmtKg = (n: number | null | undefined) =>
  n === null || n === undefined ? '' : String(Math.round(n * 100) / 100).replace('.', ',');

export function previousLabel(p?: SetEntry): string {
  if (!p) return '–';
  const reps = p.reps ?? 0;
  return p.weight ? `${fmtKg(p.weight)} kg × ${reps}` : `× ${reps}`;
}

const parse = (t: string): number | null => {
  const n = parseFloat(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** One set line: set number | previous | kg | reps | done. */
export function SetRow({ set, label, previous, isPr, onChange, onToggleDone, onMenu }: {
  set: SetEntry;
  label: string;
  previous?: SetEntry;
  isPr: boolean;
  onChange: (patch: Partial<SetEntry>) => void;
  onToggleDone: () => void;
  onMenu: () => void;
}) {
  // Text is kept locally so partial input like "22," is not reformatted while typing.
  const [kg, setKg] = useState(fmtKg(set.weight));
  const [reps, setReps] = useState(set.reps === null ? '' : String(set.reps));

  const input = {
    flex: 1,
    // Without this, text inputs keep their intrinsic width and push the row wider than the card.
    minWidth: 0,
    width: 0,
    textAlign: 'center' as const,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    backgroundColor: set.done ? 'transparent' : colors.bg,
    borderRadius: 8,
    paddingVertical: 6,
    marginHorizontal: 3,
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: set.done ? accent.done : 'transparent',
      }}
    >
      <Pressable onPress={onMenu} style={{ width: 34, alignItems: 'center' }} hitSlop={6}>
        <Text style={{ fontWeight: '800', color: set.warmup ? accent.warmup : colors.text }}>{label}</Text>
      </Pressable>
      <Pressable
        style={{ flex: 1.6, alignItems: 'center' }}
        onPress={() => {
          if (!previous) return;
          setKg(fmtKg(previous.weight));
          setReps(previous.reps === null ? '' : String(previous.reps));
          onChange({ weight: previous.weight, reps: previous.reps });
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 13 }} numberOfLines={1}>{previousLabel(previous)}</Text>
      </Pressable>
      <TextInput
        value={kg}
        onChangeText={(t) => {
          setKg(t);
          onChange({ weight: parse(t) });
        }}
        placeholder={previous?.weight ? fmtKg(previous.weight) : 'kg'}
        placeholderTextColor={colors.border}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={input}
      />
      <TextInput
        value={reps}
        onChangeText={(t) => {
          setReps(t);
          const n = parse(t);
          onChange({ reps: n === null ? null : Math.round(n) });
        }}
        placeholder={previous?.reps ? String(previous.reps) : 'pon.'}
        placeholderTextColor={colors.border}
        keyboardType="number-pad"
        selectTextOnFocus
        style={input}
      />
      <Pressable
        onPress={onToggleDone}
        accessibilityRole="checkbox"
        accessibilityLabel={`Serija ${label} odrađena`}
        accessibilityState={{ checked: set.done }}
        hitSlop={6}
        style={{
          width: 36,
          height: 32,
          marginLeft: 3,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: set.done ? colors.success : colors.bg,
        }}
      >
        {isPr && set.done ? (
          <Ionicons name="trophy" size={17} color="#fff" />
        ) : (
          <Ionicons name="checkmark" size={20} color={set.done ? '#fff' : colors.muted} />
        )}
      </Pressable>
    </View>
  );
}

export function SetHeader() {
  const h = { color: colors.muted, fontSize: 11, fontWeight: '700' as const, textAlign: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[h, { width: 34 }]}>SER.</Text>
      <Text style={[h, { flex: 1.6 }]}>PRETHODNO</Text>
      <Text style={[h, { flex: 1 }]}>KG</Text>
      <Text style={[h, { flex: 1 }]}>PON.</Text>
      <View style={{ width: 39 }} />
    </View>
  );
}
