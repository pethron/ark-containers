export function withNoIndex(html) {
  const metadata = '<meta name="robots" content="noindex, nofollow">';
  const sanitized = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi, '');
  if (/<\/head>/i.test(sanitized)) return sanitized.replace(/<\/head>/i, `${metadata}</head>`);
  // HTML permits an implicit head, as used by the downloadable UI fixture.
  if (/<html\b[^>]*>/i.test(sanitized)) return sanitized.replace(/<html\b[^>]*>/i, `$&${metadata}`);
  throw new Error('HTML has neither an explicit head nor an html root');
}
