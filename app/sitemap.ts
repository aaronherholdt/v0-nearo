export default function sitemap() {
  const base = 'https://nearo.forum';
  const urls = [
    '',                    // home
    '/auth/login',
    '/auth/sign-up',
    // add real content pages as you publish
  ].map(p => ({ url: `${base}${p}`, lastModified: new Date() }));
  return urls;
}
