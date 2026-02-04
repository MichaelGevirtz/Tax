-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('FORM_106');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExtractionStage" AS ENUM ('NORMALIZED_106');

-- CreateEnum
CREATE TYPE "FailureStage" AS ENUM ('EXTRACTION', 'NORMALIZATION', 'VALIDATION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "israeliId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "taxYear" INTEGER,
    "originalFileName" TEXT,
    "storageKey" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extraction" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "stage" "ExtractionStage" NOT NULL,
    "payload" JSONB NOT NULL,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Extraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCalculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParsingFailure" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "parserVersion" TEXT NOT NULL,
    "stage" "FailureStage" NOT NULL,
    "error" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParsingFailure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_israeliId_key" ON "User"("israeliId");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "Document_userId_taxYear_idx" ON "Document"("userId", "taxYear");

-- CreateIndex
CREATE INDEX "Extraction_documentId_idx" ON "Extraction"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Extraction_documentId_parserVersion_stage_key" ON "Extraction"("documentId", "parserVersion", "stage");

-- CreateIndex
CREATE INDEX "TaxCalculation_userId_taxYear_idx" ON "TaxCalculation"("userId", "taxYear");

-- CreateIndex
CREATE INDEX "TaxCalculation_rulesVersion_idx" ON "TaxCalculation"("rulesVersion");

-- CreateIndex
CREATE INDEX "TaxCalculation_calculationVersion_idx" ON "TaxCalculation"("calculationVersion");

-- CreateIndex
CREATE INDEX "ParsingFailure_documentId_idx" ON "ParsingFailure"("documentId");

-- CreateIndex
CREATE INDEX "ParsingFailure_documentId_parserVersion_stage_idx" ON "ParsingFailure"("documentId", "parserVersion", "stage");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extraction" ADD CONSTRAINT "Extraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCalculation" ADD CONSTRAINT "TaxCalculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParsingFailure" ADD CONSTRAINT "ParsingFailure_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
