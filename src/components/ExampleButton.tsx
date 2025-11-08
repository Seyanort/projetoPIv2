import React from 'react';
import { Button } from 'react-native-paper';

interface ExampleButtonProps {
  title: string;
  onPress: () => void;
}

export const ExampleButton = ({ title, onPress }: ExampleButtonProps) => {
  return (
    <Button mode="contained" onPress={onPress}>
      {title}
    </Button>
  );
};
