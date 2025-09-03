-- AlterTable
ALTER TABLE "Event" ADD COLUMN "latitude" REAL;
ALTER TABLE "Event" ADD COLUMN "longitude" REAL;
ALTER TABLE "Event" ADD COLUMN "mapUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN "maxPlusOnesPerGuest" INTEGER;
