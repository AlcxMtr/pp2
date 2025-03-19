/*
  Warnings:

  - You are about to drop the column `hotelPrice` on the `HotelBooking` table. All the data in the column will be lost.
  - Made the column `itineraryId` on table `HotelBooking` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HotelBooking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hotelId" INTEGER NOT NULL,
    "roomTypeId" INTEGER NOT NULL,
    "checkInDate" DATETIME NOT NULL,
    "checkOutDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "itineraryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "HotelBooking_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HotelBooking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HotelBooking_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HotelBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_HotelBooking" ("checkInDate", "checkOutDate", "hotelId", "id", "itineraryId", "roomTypeId", "status", "userId") SELECT "checkInDate", "checkOutDate", "hotelId", "id", "itineraryId", "roomTypeId", "status", "userId" FROM "HotelBooking";
DROP TABLE "HotelBooking";
ALTER TABLE "new_HotelBooking" RENAME TO "HotelBooking";
CREATE UNIQUE INDEX "HotelBooking_itineraryId_key" ON "HotelBooking"("itineraryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
