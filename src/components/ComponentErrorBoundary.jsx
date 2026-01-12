import { Component } from 'react';

class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {this.props.fallbackTitle || 'Component Error'}
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              {this.props.fallbackMessage || 'This component failed to load. Please try again.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
