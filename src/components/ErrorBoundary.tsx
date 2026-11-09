"use client";
import { Component, type ReactNode } from "react";

export default class ErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(JSON.stringify({ svc: "chitti-run-client", event: "ui-error", message: error.message }));
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center p-6 text-center" role="alert">
        <div className="panel p-6">
          <h1 className="font-pixel mb-2 text-xl text-saffron">Ayyo! Something broke.</h1>
          <p className="mb-4 text-sm text-cream/80">Even Chitti garu&apos;s best plans hit potholes sometimes. Your progress is saved.</p>
          <button
            className="btn bg-saffron px-4 py-2 text-ink"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset();
            }}
          >
            Back to menu
          </button>
        </div>
      </main>
    );
  }
}
