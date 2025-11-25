import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import * as Device from 'expo-device';

export default function ProfileScreen({ navigation }: any) {
  const [deviceName, setDeviceName] = useState('Usuário');

  useEffect(() => {
    const getName = async () => {
      const name = (Device as any).deviceName ?? 'Usuário';
      setDeviceName(name);
    };
    getName();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="headlineMedium">👤 Perfil</Text>
      <Text style={{ marginTop: 8 }}>Bem-vindo, {deviceName}!</Text>
      <Button
        mode="contained"
        style={{ marginTop: 16 }}
        onPress={() => navigation.goBack()}
      >
        Voltar
      </Button>
    </SafeAreaView>
  );
}
