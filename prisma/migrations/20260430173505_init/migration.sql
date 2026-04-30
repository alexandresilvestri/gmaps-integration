-- CreateTable
CREATE TABLE "employee" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "street" VARCHAR(60) NOT NULL,
    "number" INTEGER NOT NULL,
    "neighborhood" VARCHAR(40) NOT NULL,
    "city" VARCHAR(40) NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "street" VARCHAR(60) NOT NULL,
    "number" INTEGER NOT NULL,
    "neighborhood" VARCHAR(40) NOT NULL,
    "city" VARCHAR(40) NOT NULL,
    "zip_code" VARCHAR(10) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_name_key" ON "employee"("name");

-- CreateIndex
CREATE UNIQUE INDEX "work_name_key" ON "work"("name");
