CREATE TABLE "SearchProvider" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "queryTemplate" TEXT NOT NULL
);

ALTER TABLE "Settings" ADD COLUMN "fallbackSearchProviderId" INTEGER REFERENCES "SearchProvider" ("id");
ALTER TABLE "Settings" DROP COLUMN "fallbackSearchUrl";

INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('DuckDuckGo', 'https://duckduckgo.com/?q=');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('Google', 'https://www.google.com/search?q=');

UPDATE "Settings" SET "fallbackSearchProviderId" = (SELECT "id" FROM "SearchProvider" WHERE "name" = 'DuckDuckGo' LIMIT 1);
