ALTER TYPE "SubscriptionStatus" ADD VALUE 'TRIAL';

ALTER TABLE "Tenant" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
