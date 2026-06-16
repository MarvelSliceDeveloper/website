-- CreateTable
CREATE TABLE "GraphApiLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMsg" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GraphApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GraphApiLog_userId_idx" ON "GraphApiLog"("userId");

-- CreateIndex
CREATE INDEX "GraphApiLog_createdAt_idx" ON "GraphApiLog"("createdAt");
