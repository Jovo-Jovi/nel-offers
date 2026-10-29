export function fillMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{([A-Za-z]+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export function splitToken(template: string, token: string) {
  const marker = `{${token}}`;
  const index = template.indexOf(marker);
  if (index < 0) return { before: template, after: "" };
  return {
    before: template.slice(0, index),
    after: template.slice(index + marker.length),
  };
}
