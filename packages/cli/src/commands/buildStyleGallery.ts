export function buildStyleGallery(elementIrChecksum: string, profiles: string[]) {
  return {
    elementIrChecksum,
    policy: 'partial-output-with-profile-level-failures',
    profiles: profiles.map((profile) => ({
      profile,
      inspectPath: `dist/style-gallery/${profile}.inspect.json`,
      outputs: [`${profile}.pptx`, `${profile}.html`, `${profile}.pdf`],
    })),
  };
}
