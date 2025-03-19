import { PrismaClient } from "@prisma/client";

// Import following client in every route as follows:
// import { prisma } from "@/utils/db";

export const prisma = new PrismaClient();