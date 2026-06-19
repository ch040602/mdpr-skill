export function mapMotionKeyword(keyword: string) {
  return {
    pptx: 'static-equivalent',
    html: `css-${keyword}`,
    pdf: 'static-equivalent',
  };
}
