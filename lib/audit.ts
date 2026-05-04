import { prisma, Prisma } from "./prisma";

export async function writeAuditLog(params: {
  userId: string;
  apiKeyId?: string;
  action: string;
  resource?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await prisma.agentAuditLog.create({
    data: {
      userId: params.userId,
      apiKeyId: params.apiKeyId,
      action: params.action,
      resource: params.resource,
      detail: params.detail as unknown as Prisma.InputJsonValue,
      ipAddress: params.ipAddress,
    },
  });
}
