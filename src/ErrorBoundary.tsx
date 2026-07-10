import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Nyx render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid h-screen place-items-center bg-ink p-8 text-center">
          <div className="max-w-md">
            <h1 className="font-display text-2xl font-bold text-text">Something went sideways</h1>
            <p className="mt-2 text-sm text-muted">Nyx ran into an error. A reload usually fixes it.</p>
            <pre className="scroll-slim mt-4 max-h-40 overflow-auto rounded-xl border border-line bg-white/[0.03] p-3 text-left text-[11px] text-magenta">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl px-5 py-2.5 font-medium text-white"
              style={{ background: "linear-gradient(135deg, var(--color-cyan), var(--color-violet) 55%, var(--color-magenta))" }}
            >
              Reload Nyx
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
