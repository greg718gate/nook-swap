import { createRoot } from "react-dom/client";
import { Component, type ErrorInfo, type ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

class RootErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Root render failed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background px-6 py-16 text-foreground">
          <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
            <div className="text-2xl font-semibold">VelvetBazzar</div>
            <p className="text-muted-foreground">
              Strona nie załadowała się poprawnie. Odświeżenie pobierze najnowszą wersję aplikacji.
            </p>
            <button
              className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground"
              onClick={() => window.location.reload()}
              type="button"
            >
              Odśwież stronę
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);

document.getElementById("static-fallback")?.remove();
