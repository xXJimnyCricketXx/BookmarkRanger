-- Restoring this: it was removed by mistake. Only the "no results" fallback button and
-- the settings-page provider management list were supposed to go, not this dropdown/field.
ALTER TABLE "Settings" ADD COLUMN "fallbackSearchProviderId" INTEGER REFERENCES "SearchProvider" ("id");
