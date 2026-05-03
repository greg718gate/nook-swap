import { createRoot } from "react-dom/client";
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

const showStaticFallback = () => {
  document.getElementById("static-fallback")?.removeAttribute("hidden");
};

window.addEventListener("error", showStaticFallback);
window.addEventListener("unhandledrejection", showStaticFallback);

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);

  requestAnimationFrame(() => {
    document.documentElement.dataset.appLoaded = "true";
    document.getElementById("static-fallback")?.remove();
  });
} else {
  showStaticFallback();
}
