import { PrismaClient } from "@prisma/client";

// グローバルに使い回すための設定
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// prismaという名前で1つだけ作る
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["warn", "error"], // エラーなどをログに出す
  });

// 開発モードでは再利用
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
