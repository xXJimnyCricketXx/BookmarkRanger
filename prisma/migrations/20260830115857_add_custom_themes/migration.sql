-- CreateTable
CREATE TABLE "CustomTheme" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "bg" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "header" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
