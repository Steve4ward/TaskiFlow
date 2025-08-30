-- CreateTable
CREATE TABLE "public"."RequestEventOutbox" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "RequestEventOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestEventOutbox_orgId_createdAt_idx" ON "public"."RequestEventOutbox"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "RequestEventOutbox_processedAt_createdAt_idx" ON "public"."RequestEventOutbox"("processedAt", "createdAt");
