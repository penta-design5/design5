-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "menuSubscriptionEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "menu_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_subscriptions_categoryId_idx" ON "menu_subscriptions"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_subscriptions_userId_categoryId_key" ON "menu_subscriptions"("userId", "categoryId");

-- AddForeignKey
ALTER TABLE "menu_subscriptions" ADD CONSTRAINT "menu_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_subscriptions" ADD CONSTRAINT "menu_subscriptions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
