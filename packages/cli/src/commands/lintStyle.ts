export function lintStyle(findings: Array<{ severity: string }>, strict = false): number {
  return findings.some((finding) => finding.severity === 'error' || (strict && finding.severity === 'warn')) ? 1 : 0;
}
