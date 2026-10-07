-- Phase 7 / Catalog & Transaction Subsystem Additive Migration

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('OPEN', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('CUSTOMER_PICKUP', 'MERCHANT_FULFILLMENT', 'THIRD_PARTY_DELIVERY', 'FIELD_FULFILLMENT', 'ON_SITE', 'REMOTE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'PAYMENT_FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'WALLET_TRANSFER', 'BANK_TRANSFER', 'CARD', 'DIRECT_MERCHANT');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sku" TEXT,
    "image_url" TEXT,
    "category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "price" DOUBLE PRECISION,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sku" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_items" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "duration_minutes" INTEGER,
    "category_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT,
    "service_id" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reply" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "status" "RFQStatus" NOT NULL DEFAULT 'OPEN',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "rfq_id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "service_id" TEXT,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "booking_id" TEXT,
    "business_id" TEXT NOT NULL,
    "mode" "FulfillmentMode" NOT NULL DEFAULT 'MERCHANT_FULFILLMENT',
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'PENDING',
    "otp_code" TEXT,
    "notes" TEXT,
    "fulfilled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "fulfillment_id" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'ASSIGNED',
    "carrier_name" TEXT,
    "carrier_phone" TEXT,
    "tracking_number" TEXT,
    "proof_photo_url" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "booking_id" TEXT,
    "business_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'YER',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "reference_number" TEXT,
    "notes" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN "business_id" TEXT,
ADD COLUMN "service_id" TEXT,
ADD COLUMN "product_id" TEXT,
ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "products_business_id_idx" ON "products"("business_id");
CREATE INDEX "products_category_id_idx" ON "products"("category_id");
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");
CREATE INDEX "service_items_business_id_idx" ON "service_items"("business_id");
CREATE INDEX "service_items_category_id_idx" ON "service_items"("category_id");
CREATE INDEX "inquiries_business_id_idx" ON "inquiries"("business_id");
CREATE INDEX "inquiries_user_id_idx" ON "inquiries"("user_id");
CREATE INDEX "rfqs_business_id_idx" ON "rfqs"("business_id");
CREATE INDEX "rfqs_user_id_idx" ON "rfqs"("user_id");
CREATE INDEX "quotes_rfq_id_idx" ON "quotes"("rfq_id");
CREATE INDEX "quotes_business_id_idx" ON "quotes"("business_id");
CREATE INDEX "bookings_business_id_idx" ON "bookings"("business_id");
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX "orders_business_id_idx" ON "orders"("business_id");
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "fulfillments_order_id_idx" ON "fulfillments"("order_id");
CREATE INDEX "fulfillments_booking_id_idx" ON "fulfillments"("booking_id");
CREATE INDEX "fulfillments_business_id_idx" ON "fulfillments"("business_id");
CREATE INDEX "deliveries_fulfillment_id_idx" ON "deliveries"("fulfillment_id");
CREATE INDEX "payment_records_order_id_idx" ON "payment_records"("order_id");
CREATE INDEX "payment_records_booking_id_idx" ON "payment_records"("booking_id");
CREATE INDEX "payment_records_business_id_idx" ON "payment_records"("business_id");
CREATE INDEX "service_requests_business_id_idx" ON "service_requests"("business_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "fulfillments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
