-- CreateTable
CREATE TABLE "Violation" (
    "id" TEXT NOT NULL,
    "permitId" TEXT,
    "plateNumber" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "vehicleColor" TEXT NOT NULL,
    "stallNumber" TEXT NOT NULL,
    "photoUrl" TEXT,
    "violationType" TEXT NOT NULL,
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noticeIssued" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViolationLetter" (
    "id" TEXT NOT NULL,
    "violationId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViolationLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingInspection" (
    "id" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plateNumber" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "vehicleColor" TEXT NOT NULL,
    "stallNumber" TEXT NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "violationId" TEXT,

    CONSTRAINT "ParkingInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViolationLetter_violationId_key" ON "ViolationLetter"("violationId");

-- AddForeignKey
ALTER TABLE "Violation" ADD CONSTRAINT "Violation_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "VisitorParkingRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViolationLetter" ADD CONSTRAINT "ViolationLetter_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "Violation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParkingInspection" ADD CONSTRAINT "ParkingInspection_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "Violation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
