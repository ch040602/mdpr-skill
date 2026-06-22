export function buildCssVariables(profileId: string): string {
  return `:root{--mdpr-profile:"${profileId}";--mdpr-accent:var(--ppt-accent1);--mdpr-bg:var(--ppt-background1);}`;
}
