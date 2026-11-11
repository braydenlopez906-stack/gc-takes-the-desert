import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// If anything crashes, show what happened instead of a blank page.
class Crash extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="gutter py-16 max-w-xl mx-auto">
        <p className="pixel text-xs text-pink">SOMETHING BROKE</p>
        <h1 className="poster text-6xl mt-2">Sandstorm.</h1>
        <p className="mt-4">The site hit an error. Refresh to try again. If it keeps happening, send this to whoever runs the site:</p>
        <pre className="mt-4 p-3 bg-paper border-2 border-ink text-sm whitespace-pre-wrap break-words">{String(this.state.error?.message || this.state.error)}</pre>
      </main>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Crash>
      <App />
    </Crash>
  </React.StrictMode>
);
