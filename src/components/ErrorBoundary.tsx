import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  props: Props;
  state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      
      try {
        // Check if it's our custom Firestore error JSON
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error && parsed.operationType) {
          errorMessage = `Firestore Error: ${parsed.operationType} failed on ${parsed.path}. ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error message, use default or stringified error
        errorMessage = this.state.error?.message || String(this.state.error);
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-red-500/10 p-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Application Error</h2>
          <p className="mt-2 max-w-md text-zinc-400">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-emerald-500 px-6 py-2 font-bold text-black transition-transform hover:scale-105"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
