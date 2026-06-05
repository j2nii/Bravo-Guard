export function reportLovableError(
  error: Error,
  context?: Record<string, unknown>,
): void {
  console.error("[Error]", error, context);
}
