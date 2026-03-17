-- CreateTable activity_logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on activity_logs
CREATE INDEX IF NOT EXISTS "activity_logs_userId_idx" ON "activity_logs"("userId");
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs"("action");
CREATE INDEX IF NOT EXISTS "activity_logs_module_idx" ON "activity_logs"("module");
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateTable user_sessions
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_userId_key" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "user_sessions_lastActivity_idx" ON "user_sessions"("lastActivity");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
