export const apiPort = Number(process.env.PORT ?? 8000);

// Codespaces exposes the forwarded API port through this hostname; local development uses localhost.
export function apiBaseUrl() {
  return process.env.CODESPACE_NAME
    ? `https://${process.env.CODESPACE_NAME}-8000.app.github.dev`
    : `http://localhost:${apiPort}`;
}
