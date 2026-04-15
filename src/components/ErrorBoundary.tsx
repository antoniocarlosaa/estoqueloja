import * as React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      try {
        const parsed = JSON.parse(error?.message || '');
        if (parsed.error && parsed.operationType) {
          errorMessage = `Erro no Firestore (${parsed.operationType}): ${parsed.error}`;
        }
      } catch {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-6">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="text-2xl font-bold text-on-surface mb-2">Ops! Algo deu errado</h2>
            <p className="text-on-surface-variant mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary-container transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
