/**
 * Error Boundary — catches render errors and shows a 500-style fallback.
 */

import React from 'react';
import { captureException } from '../utils/sentry.js';
import Error500Page from '../pages/Error500Page.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <>
          {import.meta.env.DEV && this.state.error ? (
            <div className="fixed bottom-4 start-4 end-4 z-[100000] max-w-xl mx-auto p-3 bg-slate-900 text-white text-xs rounded-lg opacity-90 overflow-auto max-h-32">
              {String(this.state.error)}
            </div>
          ) : null}
          <Error500Page onRetry={this.handleReset} />
        </>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
