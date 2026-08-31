ALTER TABLE "Settings" DROP COLUMN "weatherLocation";
ALTER TABLE "Settings" ADD COLUMN "weatherUnit" TEXT NOT NULL DEFAULT 'celsius';
ALTER TABLE "Settings" ADD COLUMN "weatherExtra" TEXT NOT NULL DEFAULT 'humidity';
