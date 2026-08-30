-- "Pin new categories by default" never matched our data model (only bookmarks/snippets
-- get pinned, not categories), so it's renamed to what it actually controls now.
ALTER TABLE "Settings" RENAME COLUMN "pinCategoriesByDefault" TO "pinBookmarksByDefault";
ALTER TABLE "Settings" ADD COLUMN "pinSnippetsByDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Snippet" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
