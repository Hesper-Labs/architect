import React from "react";
import { Icon } from "../data/icons.jsx";

/**
 * Catches uncaught render errors so a single broken component doesn't take
 * down the whole app. Provides a recovery affordance and surfaces the error
 * for bug reports.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("[Architect] Uncaught render error:", error, info);
  }

  reset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    const { error, info } = this.state;
    const message = error?.message ?? String(error);
    const stack = info?.componentStack ?? error?.stack ?? "";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--bg-0, #0c0a09)",
          color: "var(--ink-0, #fafaf9)",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            background: "var(--bg-1, #1c1917)",
            border: "1px solid var(--line, #44403c)",
            borderRadius: 12,
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
              color: "var(--rose, #fb7185)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(251,113,133,0.15)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name="x" size={18} />
            </div>
            <div style={{ fontSize: 18, fontFamily: "var(--font-serif, Georgia, serif)" }}>
              Something went wrong
            </div>
          </div>
          <p style={{ color: "var(--ink-2, #a8a29e)", fontSize: 13.5, lineHeight: 1.55 }}>
            Architect hit an unexpected error and stopped rendering this view. Your work is still
            saved in localStorage. You can recover by reloading or by trying the failed action
            again.
          </p>
          <pre
            style={{
              background: "var(--bg-2, #292524)",
              border: "1px solid var(--line, #44403c)",
              borderRadius: 8,
              padding: 12,
              fontSize: 11.5,
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
              color: "var(--ink-1, #e7e5e4)",
              overflow: "auto",
              maxHeight: 220,
              marginTop: 12,
            }}
          >
            {message}
            {stack ? "\n" + stack : ""}
          </pre>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.reset}
              style={{ flex: 1 }}
            >
              <Icon name="refresh" size={13} /> Try again
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => window.location.reload()}
              style={{ flex: 1 }}
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
