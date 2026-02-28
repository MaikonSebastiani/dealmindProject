-- Add propertyLink column to Deal (run once if migration deploy is not possible)
ALTER TABLE "Deal" ADD COLUMN "propertyLink" TEXT;
