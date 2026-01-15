-- AlterTable
ALTER TABLE "Deal"
ADD COLUMN     "propertyRegistryFileName" TEXT,
ADD COLUMN     "propertyRegistryMimeType" TEXT,
ADD COLUMN     "propertyRegistryData" BYTEA,
ADD COLUMN     "auctionNoticeFileName" TEXT,
ADD COLUMN     "auctionNoticeMimeType" TEXT,
ADD COLUMN     "auctionNoticeData" BYTEA;


