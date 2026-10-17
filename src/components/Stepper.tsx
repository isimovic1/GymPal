import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { colors } from '../theme';

export function Stepper({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const btn = (delta: number, iconName: 'remove' | 'add') => (
    <Pressable
      onPress={() => onChange(Math.min(max, Math.max(min, value + delta)))}
      style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={iconName} size={18} color={colors.primary} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {btn(-1, 'remove')}
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 16, textAlign: 'center' }}>{value}</Text>
      {btn(1, 'add')}
    </View>
  );
}
