-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "acquisitionCosts" DOUBLE PRECISION NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "monthlyExpenses" DOUBLE PRECISION NOT NULL,
    "annualPropertyTax" DOUBLE PRECISION NOT NULL,
    "downPayment" DOUBLE PRECISION,
    "monthlyInstallment" DOUBLE PRECISION,
    "monthlyCashFlow" DOUBLE PRECISION NOT NULL,
    "annualCashFlow" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "capRate" DOUBLE PRECISION NOT NULL,
    "paybackYears" DOUBLE PRECISION NOT NULL,
    "riskNegativeCashFlow" BOOLEAN NOT NULL,
    "riskLowROI" BOOLEAN NOT NULL,
    "riskHighLeverage" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
