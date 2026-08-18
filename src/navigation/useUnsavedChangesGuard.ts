import { useEffect } from 'react';
import { Alert } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

type Options = {
  isDirty: boolean;
  navigation: NavigationProp<Record<string, object | undefined>>;
  title?: string;
  message?: string;
};

export function useUnsavedChangesGuard({
  isDirty,
  navigation,
  title = 'Kaydedilmemiş değişiklikler',
  message = 'Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?',
}: Options) {
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isDirty) return;

      event.preventDefault();

      Alert.alert(title, message, [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });

    return unsubscribe;
  }, [isDirty, message, navigation, title]);
}
