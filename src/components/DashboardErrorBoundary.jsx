import { Component } from 'react';

class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="w-full max-w-lg">
            <div className="backdrop-blur-sm rounded-2xl p-8 bg-zinc-900/60 border border-zinc-800">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-white mb-3">Oops! Something broke</h1>
                <p className="text-zinc-400 text-sm mb-6">
                  Don't worry, this is just a temporary glitch. Your progress is saved.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
                    <p className="text-red-400 text-xs font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
