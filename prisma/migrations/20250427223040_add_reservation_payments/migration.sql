-- CreateTable
CREATE TABLE "ReservationPayment" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReservationPayment" ADD CONSTRAINT "ReservationPayment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
