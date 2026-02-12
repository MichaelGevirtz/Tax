-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "wizardState" JSONB NOT NULL,
    "softResult" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_token_key" ON "Reminder"("token");

-- CreateIndex
CREATE INDEX "Reminder_email_idx" ON "Reminder"("email");

-- CreateIndex
CREATE INDEX "Reminder_token_idx" ON "Reminder"("token");
