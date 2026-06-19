export function mapDesignSourceToken(name: string): string {
  return name.replace(/^color\./, 'style.color.').replace(/^space\./, 'style.space.').replace(/^radius\./, 'style.radius.');
}
