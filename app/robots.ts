export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: 'GPTBot', allow: '/' },          // OpenAI
      { userAgent: 'Google-Extended', allow: '/' }, // Google AI features
      { userAgent: 'PerplexityBot', allow: '/' },   // Perplexity
      { userAgent: 'CCBot', allow: '/' },           // Common Crawl
      { userAgent: 'ClaudeBot', allow: '/' }        // Anthropic (emerging UA)
    ],
    sitemap: 'https://nearo.forum/sitemap.xml',
  };
}
