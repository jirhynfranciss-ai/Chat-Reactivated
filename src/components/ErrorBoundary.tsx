import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled application error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
          style={{ background: "#FFFBF0", color: "#2D1A1F" }}
        >
          <span className="text-4xl">🤍</span>
          <h1 className="font-serif text-2xl font-semibold">
            Something went wrong. Please try again. 🤍
          </h1>
          <button
            onClick={() => window.location.assign("/")}
            className="rounded-2xl px-6 py-3 text-white"
            style={{ background: "#8B3A3A" }}
          >
            Back to Start
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
