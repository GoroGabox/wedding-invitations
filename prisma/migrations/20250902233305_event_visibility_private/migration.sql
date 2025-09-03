-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "mapUrl" TEXT,
    "maxPlusOnesPerGuest" INTEGER,
    "ownerId" INTEGER,
    "dressCode" TEXT,
    "cateringCode" TEXT,
    "openBar" BOOLEAN NOT NULL DEFAULT true,
    "hasGiftList" BOOLEAN NOT NULL DEFAULT true,
    "askDietaryRestrictions" BOOLEAN NOT NULL DEFAULT false,
    "timeline" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    CONSTRAINT "Event_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("askDietaryRestrictions", "cateringCode", "coverImageUrl", "createdAt", "date", "description", "dressCode", "hasGiftList", "id", "latitude", "longitude", "mapUrl", "maxPlusOnesPerGuest", "openBar", "ownerId", "slug", "time", "timeline", "title", "updatedAt", "venueAddress", "venueName") SELECT "askDietaryRestrictions", "cateringCode", "coverImageUrl", "createdAt", "date", "description", "dressCode", "hasGiftList", "id", "latitude", "longitude", "mapUrl", "maxPlusOnesPerGuest", "openBar", "ownerId", "slug", "time", "timeline", "title", "updatedAt", "venueAddress", "venueName" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
