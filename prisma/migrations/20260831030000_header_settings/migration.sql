ALTER TABLE "Settings" ADD COLUMN "hideHeadline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Settings" ADD COLUMN "hideDate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Settings" ADD COLUMN "hideTime" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Settings" ADD COLUMN "dateFormat" TEXT NOT NULL DEFAULT 'day-first';
ALTER TABLE "Settings" ADD COLUMN "customGreetings" TEXT NOT NULL DEFAULT 'Guten Abend!;Guten Tag!;Guten Morgen!;Gute Nacht!';
ALTER TABLE "Settings" ADD COLUMN "customWeekdayNames" TEXT NOT NULL DEFAULT 'Sonntag;Montag;Dienstag;Mittwoch;Donnerstag;Freitag;Samstag';
ALTER TABLE "Settings" ADD COLUMN "customMonthNames" TEXT NOT NULL DEFAULT 'Januar;Februar;März;April;Mai;Juni;Juli;August;September;Oktober;November;Dezember';
