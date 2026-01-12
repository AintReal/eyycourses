import { Component } from 'react';

class AdminErrorBoundary extends Component {
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

  handleGoBack = () => {
    window.location.href = '/admin/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="w-full max-w-lg">
            <div className="backdrop-blur-sm rounded-2xl p-8 bg-zinc-900/60 border border-zinc-800">
              <div className="text-center">
                <div className="text-6xl mb-4">🔧</div>
                <h1 className="text-2xl font-bold text-white mb-3">Admin Panel Error</h1>
                <p className="text-zinc-400 text-sm mb-6">
                  The admin panel encountered an error. Please try reloading.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left max-h-48 overflow-auto">
                    <p className="text-red-400 text-xs font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 py-3 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl transition-all"
                  >
                    Reload
                  </button>
                  <button
                    onClick={this.handleGoBack}
                    className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all"
                  >
                    Dashboard
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

export default AdminErrorBoundary;
