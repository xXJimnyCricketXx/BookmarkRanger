-- The "default fallback provider" setting is gone: the dashboard search bar now lets
-- you pick a provider per search instead, so there's nothing left reading this column.
ALTER TABLE "Settings" DROP COLUMN "fallbackSearchProviderId";
