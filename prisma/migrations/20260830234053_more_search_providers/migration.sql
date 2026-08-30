-- The rest of the provider list originally requested (Deezer, Disroot, DuckDuckGo,
-- Google, IMDb, Reddit, Spotify, The Movie Database, Tidal, Wikipedia, YouTube) —
-- DuckDuckGo and Google were already seeded in the previous migration.
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('Deezer', 'https://www.deezer.com/search/');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('Disroot', 'https://search.disroot.org/search?q=');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('IMDb', 'https://www.imdb.com/find/?q=');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('Reddit', 'https://www.reddit.com/search/?q=');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('Spotify', 'https://open.spotify.com/search/');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('The Movie Database', 'https://www.themoviedb.org/search?query=');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('Tidal', 'https://listen.tidal.com/search?q=');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('Wikipedia', 'https://en.wikipedia.org/w/index.php?search=');
INSERT INTO "SearchProvider" ("name", "queryTemplate") VALUES ('YouTube', 'https://www.youtube.com/results?search_query=');
