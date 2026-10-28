export function fillPlaceholders(
  pattern: string,
  values: Record<string, string>,
): string {
  return pattern.replace(/\{([A-Za-z]+)\}/g, (whole, key: string) => {
    const filled = values[key];
    return filled === undefined ? whole : filled;
  });
}
