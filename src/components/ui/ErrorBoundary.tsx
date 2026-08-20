import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Forged runtime error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080b] px-6 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xl">!</div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/45">Forged System</p>
          <h1 className="mb-3 text-2xl font-bold">A temporary system error occurred.</h1>
          <p className="mb-6 text-sm leading-6 text-white/55">Your progress is safe. Reload the page and Forged will restore the session.</p>
          <button type="button" onClick={this.handleReload} className="rounded-xl border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-semibold transition hover:bg-white/[0.14] focus:outline-none focus:ring-2 focus:ring-white/30">Reload Forged</button>
        </div>
      </div>
    );
  }
}
