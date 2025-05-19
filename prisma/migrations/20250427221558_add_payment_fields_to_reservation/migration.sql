-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'partial', 'paid');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "amountPaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
