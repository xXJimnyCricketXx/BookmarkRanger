-- Themes are now a single fixed look per preset (see config/themes.js), so the
-- per-account light/dark toggle preference is no longer needed.
ALTER TABLE "Account" DROP COLUMN "theme";
