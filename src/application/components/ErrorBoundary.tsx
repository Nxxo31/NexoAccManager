import { Component, ReactNode } from 'react';
import { Container, Stack, Text, Button } from '@mantine/core';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container size="sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Stack align="center" gap="md">
            <Text size="xl" fw={700} c="red">Algo salió mal</Text>
            <Text size="sm" c="dimmed" ta="center">{this.state.error?.message ?? 'Error desconocido'}</Text>
            <Button
              variant="filled"
              color="primary"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Reintentar
            </Button>
          </Stack>
        </Container>
      );
    }
    return this.props.children;
  }
}
