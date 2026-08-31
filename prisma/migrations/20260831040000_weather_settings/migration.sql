ALTER TABLE "Settings" ADD COLUMN "hideWeather" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Settings" ADD COLUMN "weatherLocation" TEXT;
ALTER TABLE "Settings" ADD COLUMN "weatherLat" REAL;
ALTER TABLE "Settings" ADD COLUMN "weatherLon" REAL;
