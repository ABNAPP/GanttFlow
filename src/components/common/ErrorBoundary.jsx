/**
 * Error Boundary component for catching React errors
 * Displays user-friendly error messages
 */
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {this.props.t ? this.props.t('errorOccurred') : 'Ett fel uppstod'}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {this.props.t ? this.props.t('errorBoundaryMessage') : 'Applikationen stötte på ett oväntat fel. Försök ladda om sidan.'}
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                  Teknisk information
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw size={16} />
              {this.props.t ? this.props.t('reloadPage') : 'Ladda om sidan'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

