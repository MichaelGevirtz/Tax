import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

const RATE_LIMIT_HOURS = 24;
const TOKEN_EXPIRY_DAYS = 30;

export async function findRecentReminderByEmail(email: string) {
  const cutoff = new Date(Date.now() - RATE_LIMIT_HOURS * 60 * 60 * 1000);
  return prisma.reminder.findFirst({
    where: {
      email,
      createdAt: { gt: cutoff },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReminder(data: {
  email: string;
  wizardState: Prisma.InputJsonValue;
  softResult: Prisma.InputJsonValue;
}) {
  return prisma.reminder.create({ data });
}

export async function findReminderByToken(token: string) {
  return prisma.reminder.findUnique({ where: { token } });
}

export async function setReminderSentAt(id: string) {
  return prisma.reminder.update({
    where: { id },
    data: { sentAt: new Date() },
  });
}

export async function setReminderReturnedAt(id: string) {
  return prisma.reminder.update({
    where: { id },
    data: { returnedAt: new Date() },
  });
}

export function isTokenExpired(createdAt: Date): boolean {
  const expiry = new Date(
    createdAt.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  return new Date() > expiry;
}
