export function paramString(value: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function paramInt(value: string | string[]): number {
  return parseInt(paramString(value), 10);
}
