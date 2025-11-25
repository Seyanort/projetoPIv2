import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="headlineMedium">🏠 Home Screen</Text>
      <Button
        mode="contained"
        style={{ marginTop: 16 }}
        onPress={() => navigation.navigate('Profile', { userName: 'Calouros' })}
      >
        Ir para Perfil
      </Button>
    </SafeAreaView>
  );
}
