-- CreateTable
CREATE TABLE "admin_departments" (
    "user_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "admin_departments_pkey" PRIMARY KEY ("user_id","department_id")
);

-- AddForeignKey
ALTER TABLE "admin_departments" ADD CONSTRAINT "admin_departments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_departments" ADD CONSTRAINT "admin_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
