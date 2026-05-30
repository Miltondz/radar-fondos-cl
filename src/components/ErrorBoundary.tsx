import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    try {
      localStorage.setItem("milton_radar_last_error", JSON.stringify({
        message: error.message,
        stack: error.stack?.slice(0, 800),
        ts: new Date().toISOString(),
      }));
    } catch { /* noop */ }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RadarFondos] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "monospace",
          background: "#FAF6EE",
          color: "#1C1C1C",
          textAlign: "center",
          gap: "1.5rem",
        }}>
          <div style={{ fontSize: "2.5rem" }}>⚠️</div>
          <div>
            <p style={{ fontWeight: 900, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
              Radar Fondos — Error inesperado
            </p>
            <p style={{ fontSize: "0.75rem", opacity: 0.6, maxWidth: "32ch", lineHeight: 1.5 }}>
              {this.state.error?.message ?? "Error desconocido"}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 2rem",
              background: "#1C1C1C",
              color: "#FAF6EE",
              border: "2px solid #1C1C1C",
              fontFamily: "monospace",
              fontWeight: 900,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            Recargar App
          </button>
          <p style={{ fontSize: "0.65rem", opacity: 0.4 }}>
            Si el error persiste, limpia el caché del navegador.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
