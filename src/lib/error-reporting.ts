type ErrorReportOptions = {
  mechanism?: string;
  handled?: boolean;
};

type ErrorReporter = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: ErrorReportOptions,
  ) => void;
};

declare global {
  interface Window {
    __appErrorReporter?: ErrorReporter;
  }
}

export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  window.__appErrorReporter?.captureException?.(error, context, {
    mechanism: "react_error_boundary",
    handled: true,
  });
}
