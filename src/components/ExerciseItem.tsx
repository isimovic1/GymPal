import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, Text, View } from 'react-native';

import { equipmentLabel, imageUrl, muscleLabel } from '../lib/exercises';
import type { Exercise } from '../lib/types';
import { colors, spacing } from '../theme';
import { styles } from './ui';

export function ExerciseThumb({ exercise, size = 48 }: { exercise?: Exercise; size?: number }) {
  const first = exercise?.images[0];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        backgroundColor: colors.bg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {first ? (
        <Image source={{ uri: imageUrl(first) }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Ionicons name="barbell-outline" size={size * 0.5} color={colors.muted} />
      )}
    </View>
  );
}

export function ExerciseItem({ exercise, onPress, selected, right }: {
  exercise: Exercise;
  onPress: () => void;
  selected?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.sm,
        borderRadius: 12,
        backgroundColor: selected ? colors.primarySoft : pressed ? colors.bg : colors.card,
      })}
    >
      <ExerciseThumb exercise={exercise} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.text, { fontWeight: '600' }]} numberOfLines={1}>{exercise.name}</Text>
        <Text style={[styles.muted, { fontSize: 12 }]} numberOfLines={1}>
          {exercise.primaryMuscles.map(muscleLabel).join(', ')} · {equipmentLabel(exercise.equipment)}
          {exercise.custom ? ' · vlastita' : ''}
        </Text>
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} /> : right}
    </Pressable>
  );
}
