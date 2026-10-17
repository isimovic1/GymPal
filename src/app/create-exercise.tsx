import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { Button, Card, Field, Screen, styles } from '../components/ui';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../lib/exercises';
import { newId, useStore } from '../lib/store';
import { colors, spacing } from '../theme';

export default function CreateExercise() {
  const { saveCustomExercise } = useStore();
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState('other');

  const save = () => {
    if (!name.trim()) return Alert.alert('Naziv', 'Upiši naziv vježbe.');
    if (!muscle) return Alert.alert('Mišić', 'Odaberi glavnu mišićnu skupinu.');
    saveCustomExercise({
      id: `custom:${newId()}`,
      name: name.trim(),
      category: 'strength',
      equipment,
      primaryMuscles: [muscle],
      secondaryMuscles: [],
      instructions: [],
      images: [],
      custom: true,
    });
    router.back();
  };

  return (
    <Screen>
      <Card>
        <Field label="Naziv vježbe" value={name} onChangeText={setName} placeholder="npr. Hip abduction sprava" />
      </Card>
      <Card title="Glavni mišić">
        <Chips options={MUSCLE_LABELS} value={muscle} onChange={setMuscle} />
      </Card>
      <Card title="Oprema">
        <Chips options={EQUIPMENT_LABELS} value={equipment} onChange={(v) => setEquipment(v)} />
      </Card>
      <Button title="Spremi vježbu" onPress={save} />
    </Screen>
  );
}

function Chips({ options, value, onChange }: {
  options: Record<string, string>;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {Object.entries(options).map(([key, label]) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: active ? colors.primary : colors.primarySoft }}
          >
            <Text style={[styles.text, { color: active ? '#fff' : colors.primary, fontWeight: '600', fontSize: 13 }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
