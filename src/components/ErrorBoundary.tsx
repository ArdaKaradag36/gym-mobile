import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../theme/colors';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.brand}>FORGE</Text>
        <Text style={styles.title}>Bir şeyler ters gitti</Text>
        <Text style={styles.copy}>
          Uygulama beklenmeyen bir hatayla durdu. Tekrar dene; devam ederse çıkış yapıp yeniden
          gir.
        </Text>
        <Pressable onPress={() => this.setState({ error: null })} style={styles.button}>
          <Text style={styles.buttonText}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.marginPage,
    gap: spacing.stackMd,
  },
  brand: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: 4,
    color: '#C3F400',
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    color: '#E5E2E1',
    textAlign: 'center',
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#C4C9AC',
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.stackSm,
    minHeight: 48,
    paddingHorizontal: spacing.stackLg,
    borderRadius: radii.lg,
    backgroundColor: '#C3F400',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#161E00',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
