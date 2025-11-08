import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export const ProfileScreen = ({ route, navigation }: Props) => {
  const { userName } = route.params;

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="headlineMedium">👤 Perfil</Text>
      <Text style={{ marginTop: 8 }}>Bem-vindo, {userName}!</Text>
      <Button mode="contained" style={{ marginTop: 16 }} onPress={() => navigation.goBack()}>
        Voltar
      </Button>
    </SafeAreaView>
  );
};
