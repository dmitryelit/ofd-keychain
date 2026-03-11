export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[telemetry]", name, payload ?? {});
  }
}
