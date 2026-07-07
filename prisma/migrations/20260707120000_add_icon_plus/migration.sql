-- CreateEnum
CREATE TYPE "IconPlusType" AS ENUM ('MAIN', 'MERGE_ICON', 'MERGE_TEXT');

-- CreateTable
CREATE TABLE "icon_plus_resources" (
    "id" TEXT NOT NULL,
    "type" "IconPlusType" NOT NULL,
    "name" TEXT NOT NULL,
    "svgContent" TEXT NOT NULL,
    "viewBox" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "baseWidth" DOUBLE PRECISION,
    "baseHeight" DOUBLE PRECISION,
    "anchorX" DOUBLE PRECISION,
    "anchorY" DOUBLE PRECISION,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "icon_plus_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "icon_plus_resources_type_createdAt_idx" ON "icon_plus_resources"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "icon_plus_resources" ADD CONSTRAINT "icon_plus_resources_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
