-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'supervisor', 'employee');
CREATE TYPE "UserStatus" AS ENUM ('active', 'disabled');
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'expired');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'employee',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "department_id" TEXT,
    "honor_points" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "incentive_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "honor_value" INTEGER NOT NULL DEFAULT 10,
    "badge_icon" TEXT,
    CONSTRAINT "incentive_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "incentive_records" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type_id" TEXT,
    "honor_value" INTEGER NOT NULL,
    "issued_by" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incentive_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "incentive_recipients" (
    "incentive_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "incentive_recipients_pkey" PRIMARY KEY ("incentive_id","user_id")
);

CREATE TABLE "co_honor_edges" (
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "co_count" INTEGER NOT NULL DEFAULT 1,
    "total_honor_value" INTEGER NOT NULL DEFAULT 0,
    "last_co_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "co_honor_edges_pkey" PRIMARY KEY ("user_a_id","user_b_id")
);

CREATE TABLE "task_orders" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "likes_from_user_id_to_user_id_target_type_target_id_key" ON "likes"("from_user_id", "to_user_id", "target_type", "target_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incentive_records" ADD CONSTRAINT "incentive_records_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "incentive_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "incentive_records" ADD CONSTRAINT "incentive_records_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incentive_recipients" ADD CONSTRAINT "incentive_recipients_incentive_id_fkey" FOREIGN KEY ("incentive_id") REFERENCES "incentive_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "incentive_recipients" ADD CONSTRAINT "incentive_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "co_honor_edges" ADD CONSTRAINT "co_honor_edges_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "co_honor_edges" ADD CONSTRAINT "co_honor_edges_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_orders" ADD CONSTRAINT "task_orders_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "likes" ADD CONSTRAINT "likes_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
