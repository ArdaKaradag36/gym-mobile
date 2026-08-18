import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavigationAction, NavigationProp } from '@react-navigation/native';

import { ConfirmSheet } from '../components/ConfirmSheet';

type Options = {
  isDirty: boolean;
  navigation: NavigationProp<Record<string, object | undefined>>;
  saving?: boolean;
  title?: string;
  message?: string;
};

export function useUnsavedChangesGuard({
  isDirty,
  navigation,
  saving = false,
  title = 'Kaydedilmemiş değişiklikler',
  message = 'Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?',
}: Options) {
  const skipRef = useRef(false);
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(null);

  const skipNext = useCallback(() => {
    skipRef.current = true;
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (skipRef.current || saving || !isDirty) {
        skipRef.current = false;
        return;
      }

      event.preventDefault();
      setPendingAction(event.data.action);
    });

    return unsubscribe;
  }, [isDirty, navigation, saving]);

  const sheet = (
    <ConfirmSheet
      visible={pendingAction != null}
      title={title}
      message={message}
      onCancel={() => setPendingAction(null)}
      onConfirm={() => {
        const action = pendingAction;
        setPendingAction(null);
        skipRef.current = true;
        if (action) navigation.dispatch(action);
      }}
    />
  );

  return { skipNext, sheet };
}
