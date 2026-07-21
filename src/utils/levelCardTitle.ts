export function levelCardTitle(level: string, name?: string | null): string {
  return name ? `${level}:${name}` : level
}
