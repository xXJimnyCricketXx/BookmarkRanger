-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bookmark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "pinnedOrder" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastVisitedAt" DATETIME,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dashboardGroupId" INTEGER,
    "dashboardGroupOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Bookmark_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bookmark_dashboardGroupId_fkey" FOREIGN KEY ("dashboardGroupId") REFERENCES "DashboardGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bookmark" ("categoryId", "clicks", "createdAt", "dashboardGroupId", "dashboardGroupOrder", "description", "icon", "id", "isPinned", "lastVisitedAt", "order", "pinnedOrder", "title", "updatedAt", "url") SELECT "categoryId", "clicks", "createdAt", "dashboardGroupId", "dashboardGroupOrder", "description", "icon", "id", "isPinned", "lastVisitedAt", "order", "pinnedOrder", "title", "updatedAt", "url" FROM "Bookmark";
DROP TABLE "Bookmark";
ALTER TABLE "new_Bookmark" RENAME TO "Bookmark";
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteName" TEXT NOT NULL DEFAULT 'BookmarkRanger',
    "themePreset" TEXT NOT NULL DEFAULT 'bookmarkranger',
    "sortingType" TEXT NOT NULL DEFAULT 'createdAt',
    "pinBookmarksByDefault" BOOLEAN NOT NULL DEFAULT false,
    "pinSnippetsByDefault" BOOLEAN NOT NULL DEFAULT false,
    "pinCategoriesByDefault" BOOLEAN NOT NULL DEFAULT false,
    "openLinksInNewTab" BOOLEAN NOT NULL DEFAULT true,
    "hideSearchBar" BOOLEAN NOT NULL DEFAULT false,
    "disableSearchAutofocus" BOOLEAN NOT NULL DEFAULT false,
    "hideBookmarksSection" BOOLEAN NOT NULL DEFAULT false,
    "hideSnippetsSection" BOOLEAN NOT NULL DEFAULT false,
    "hideHeadline" BOOLEAN NOT NULL DEFAULT false,
    "hideDate" BOOLEAN NOT NULL DEFAULT false,
    "hideTime" BOOLEAN NOT NULL DEFAULT true,
    "hideWeather" BOOLEAN NOT NULL DEFAULT false,
    "weatherLat" REAL,
    "weatherLon" REAL,
    "weatherUnit" TEXT NOT NULL DEFAULT 'celsius',
    "weatherExtra" TEXT NOT NULL DEFAULT 'humidity',
    "dateFormat" TEXT NOT NULL DEFAULT 'day-first',
    "customGreetings" TEXT NOT NULL DEFAULT 'Guten Abend!;Guten Tag!;Guten Morgen!;Gute Nacht!',
    "customWeekdayNames" TEXT NOT NULL DEFAULT 'Sonntag;Montag;Dienstag;Mittwoch;Donnerstag;Freitag;Samstag',
    "customMonthNames" TEXT NOT NULL DEFAULT 'Januar;Februar;März;April;Mai;Juni;Juli;August;September;Oktober;November;Dezember',
    "fallbackSearchProviderId" INTEGER,
    "autoBackupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoBackupIntervalDays" INTEGER NOT NULL DEFAULT 1,
    "backupKeepCount" INTEGER NOT NULL DEFAULT 7,
    "backupKeepDays" INTEGER NOT NULL DEFAULT 30,
    CONSTRAINT "Settings_fallbackSearchProviderId_fkey" FOREIGN KEY ("fallbackSearchProviderId") REFERENCES "SearchProvider" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("customGreetings", "customMonthNames", "customWeekdayNames", "dateFormat", "disableSearchAutofocus", "fallbackSearchProviderId", "hideBookmarksSection", "hideDate", "hideHeadline", "hideSearchBar", "hideSnippetsSection", "hideTime", "hideWeather", "id", "openLinksInNewTab", "pinBookmarksByDefault", "pinCategoriesByDefault", "pinSnippetsByDefault", "siteName", "sortingType", "themePreset", "weatherExtra", "weatherLat", "weatherLon", "weatherUnit") SELECT "customGreetings", "customMonthNames", "customWeekdayNames", "dateFormat", "disableSearchAutofocus", "fallbackSearchProviderId", "hideBookmarksSection", "hideDate", "hideHeadline", "hideSearchBar", "hideSnippetsSection", "hideTime", "hideWeather", "id", "openLinksInNewTab", "pinBookmarksByDefault", "pinCategoriesByDefault", "pinSnippetsByDefault", "siteName", "sortingType", "themePreset", "weatherExtra", "weatherLat", "weatherLon", "weatherUnit" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

