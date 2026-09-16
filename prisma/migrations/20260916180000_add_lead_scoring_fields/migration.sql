-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "scoreAlgorithmVersion" TEXT DEFAULT 'v1',
ADD COLUMN     "scoreCategory" TEXT,
ADD COLUMN     "scoreUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "leadId" TEXT;

-- CreateIndex
CREATE INDEX "leads_organizationId_score_idx" ON "leads"("organizationId", "score");

-- CreateIndex
CREATE INDEX "leads_organizationId_scoreCategory_idx" ON "leads"("organizationId", "scoreCategory");

-- CreateIndex
CREATE INDEX "opportunities_organizationId_leadId_idx" ON "opportunities"("organizationId", "leadId");

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
