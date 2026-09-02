-- CreateTable
CREATE TABLE "SharePage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SharePage_token_key" ON "SharePage"("token");

-- CreateTable
CREATE TABLE "_SharePageCategories" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SharePageCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SharePageCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "SharePage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_SharePageCategories_AB_unique" ON "_SharePageCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_SharePageCategories_B_index" ON "_SharePageCategories"("B");

-- CreateTable
CREATE TABLE "_SharePageSnippets" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SharePageSnippets_A_fkey" FOREIGN KEY ("A") REFERENCES "SharePage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SharePageSnippets_B_fkey" FOREIGN KEY ("B") REFERENCES "Snippet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_SharePageSnippets_AB_unique" ON "_SharePageSnippets"("A", "B");

-- CreateIndex
CREATE INDEX "_SharePageSnippets_B_index" ON "_SharePageSnippets"("B");
