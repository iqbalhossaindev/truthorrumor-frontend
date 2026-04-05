# TruthOrRumor Auto SEO Package

This package includes:

1. Improved `article.html`
2. Improved `article-bd.html`
3. Updated `robots.txt`
4. Static `sitemap.xml` index
5. Static `news-sitemap.xml` fallback
6. Live Vercel API sitemaps:
   1. `/api/sitemap.xml`
   2. `/api/news-sitemap.xml`

## How it works

1. Article pages update page SEO tags from Supabase article data.
2. `/api/sitemap.xml` builds the main sitemap live from Supabase.
3. `/api/news-sitemap.xml` builds the News sitemap live from Supabase.
4. `robots.txt` points search engines to the live sitemap endpoints.

## Optional environment variables

You can keep the current hardcoded defaults, or set these in Vercel:

1. `SITE_URL`
2. `SUPABASE_URL`
3. `SUPABASE_ANON_KEY`
