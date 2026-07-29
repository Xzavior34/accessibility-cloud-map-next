"use client";

import { Component, useEffect, useState, type ReactNode } from 'react';

// A temporary diagnostic tool: catches render errors (via the class-based
// error boundary) AND global runtime errors/unhandled promise rejections
// (via window listeners, which error boundaries can't catch), and displays
// them as plain visible text on the page. This exists so an error can be
// screenshotted directly from a phone, without needing DevTools/a computer.
//
// Safe to remove once the underlying issue is fixed and confirmed working.

interface BoundaryState {
  error: Error | null;
}

class RenderErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <ErrorDisplay label="Render error" error={this.state.error} />;
    }
    return this.props.children;
  }
}

function useGlobalErrorCapture() {
  const [globalError, setGlobalError] = useState<{ label: string; message: string } | null>(null);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      setGlobalError({ label: 'Uncaught error', message: event.message || String(event.error) });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      setGlobalError({
        label: 'Unhandled promise rejection',
        message: event.reason?.message || String(event.reason),
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return globalError;
}

function ErrorDisplay({ label, error, message }: { label: string; error?: Error; message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-red-50 overflow-auto p-4 font-mono text-sm">
      <p className="font-sans font-bold text-red-800 text-base mb-2">⚠ {label} (diagnostic mode)</p>
      <pre className="whitespace-pre-wrap text-red-900 bg-white border border-red-200 rounded-lg p-3">
        {message || error?.message}
        {error?.stack ? `\n\n${error.stack}` : ''}
      </pre>
      <p className="font-sans text-xs text-gray-500 mt-3">
        Screenshot this whole screen and send it — this text is the actual cause.
      </p>
    </div>
  );
}

export function DiagnosticErrorBoundary({ children }: { children: ReactNode }) {
  const globalError = useGlobalErrorCapture();

  if (globalError) {
    return <ErrorDisplay label={globalError.label} message={globalError.message} />;
  }

  return <RenderErrorBoundary>{children}</RenderErrorBoundary>;
}
