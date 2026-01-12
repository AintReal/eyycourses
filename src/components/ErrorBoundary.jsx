import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }


  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/signin';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="backdrop-blur-sm rounded-2xl p-8 bg-zinc-900/40 border border-zinc-700/50">
              <div className="text-center">
                <div className="text-6xl mb-4">😢</div>
                <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
                <p className="text-gray-400 text-sm mb-6">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6 text-left">
                    <p className="text-red-400 text-xs font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                <button
                  onClick={this.handleReset}
                  className="w-full py-3.5 bg-white hover:bg-gray-100 active:bg-gray-200 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-[15px]"
                >
                  <span className="text-gray-900">Go back to sign in</span>
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 text-xs">
                If this keeps happening, please contact support
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;