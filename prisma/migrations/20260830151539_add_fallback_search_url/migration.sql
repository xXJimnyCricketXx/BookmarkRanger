-- URL template for the dashboard search fallback (query gets appended when local
-- search finds nothing), e.g. "https://duckduckgo.com/?q=".
ALTER TABLE "Settings" ADD COLUMN "fallbackSearchUrl" TEXT NOT NULL DEFAULT 'https://duckduckgo.com/?q=';
