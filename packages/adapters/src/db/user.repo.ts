import { Prisma, User } from "@prisma/client";
import { prisma } from "./prisma";

export async function createUser(data: Prisma.UserCreateInput): Promise<User> {
  return prisma.user.create({ data });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function updateUser(
  id: string,
  data: Prisma.UserUpdateInput
): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}
