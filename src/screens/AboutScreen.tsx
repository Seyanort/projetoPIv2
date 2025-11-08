import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';

export const AboutScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="headlineMedium">📖 Sobre</Text>
      <Text style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 16 }}>
        Esse consiste em um app simples, que tem como objetivo adicionar e consultar datas e horários de seus compromissos. É isso!
      </Text>
    </SafeAreaView>
  );
};
