-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Itinerary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "creditCardNumber" TEXT,
    "cardExpiry" TEXT,
    "invoiceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Itinerary" ("cardExpiry", "creditCardNumber", "id", "invoiceUrl", "userId") SELECT "cardExpiry", "creditCardNumber", "id", "invoiceUrl", "userId" FROM "Itinerary";
DROP TABLE "Itinerary";
ALTER TABLE "new_Itinerary" RENAME TO "Itinerary";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
