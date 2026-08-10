/**
 * Merges multiple prop objects together, correctly combining event handlers
 * and className strings rather than overwriting them.
 */
export function mergeProps<T extends Record<string, unknown>>(
  ...propsList: Array<Partial<T>>
): T {
  const result: Record<string, unknown> = {};

  for (const props of propsList) {
    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        const existing = result[key];
        if (typeof existing === 'function') {
          result[key] = (...args: unknown[]) => {
            existing(...args);
            (value as (...args: unknown[]) => void)(...args);
          };
        } else {
          result[key] = value;
        }
      } else if (key === 'className') {
        const existing = result[key];
        result[key] = [existing, value].filter(Boolean).join(' ');
      } else if (key === 'style') {
        result[key] = { ...(result[key] as object), ...(value as object) };
      } else {
        result[key] = value;
      }
    }
  }

  return result as T;
}
