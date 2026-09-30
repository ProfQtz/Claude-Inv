import { TriangleAlert } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { encodeBackup, migrateProgress } from "../state/progress";
import { STORAGE_KEY } from "../state/useProgress";

interface State {
  error: Error | null;
  backup: string | null;
  confirmReset: boolean;
}

/** The saved progress as a backup code, if it can still be read. */
function savedBackup(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? encodeBackup(migrateProgress(JSON.parse(raw))) : null;
  } catch {
    return null;
  }
}

/**
 * Last line of defence for render errors. Progress stays in storage, so the
 * screen offers a reload first, a backup code second and a reset only as a
 * deliberate two-step choice.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, backup: null, confirmReset: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PokerLingo crashed", error, info.componentStack);
  }

  private reset = () => {
    if (!this.state.confirmReset) {
      this.setState({ confirmReset: true });
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing more we can do; the reload below still gives a fresh start if storage works.
    }
    location.reload();
  };

  render() {
    const { error, backup, confirmReset } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="crash">
        <div className="crash-card">
          <span className="icon-disc red">
            <TriangleAlert size={28} aria-hidden="true" />
          </span>
          <h1>Something went wrong</h1>
          <p>PokerLingo hit an unexpected error. Your progress is still saved in this browser, so reloading usually fixes it.</p>
          <button className="btn btn-primary wide" onClick={() => location.reload()}>
            Reload
          </button>
          {backup ? (
            <textarea
              className="code-box"
              readOnly
              rows={4}
              value={backup}
              aria-label="Backup code"
              onFocus={(e) => e.currentTarget.select()}
            />
          ) : (
            <button className="btn btn-secondary wide" onClick={() => this.setState({ backup: savedBackup() ?? "No saved progress found." })}>
              Show a backup code
            </button>
          )}
          <button className="btn btn-ghost danger" onClick={this.reset}>
            {confirmReset ? "Tap again to erase all progress" : "Still broken? Reset progress"}
          </button>
          <details className="crash-details">
            <summary>Error details</summary>
            <code>{error.message || String(error)}</code>
          </details>
        </div>
      </main>
    );
  }
}
