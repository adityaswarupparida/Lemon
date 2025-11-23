import { PrismaClient } from "./generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg';

// const connectionString = `${process.env.DATABASE_URL}`;
// console.log("DB URL:", process.env.DATABASE_URL!);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, })
const prisma = new PrismaClient({ adapter })

export default prisma;