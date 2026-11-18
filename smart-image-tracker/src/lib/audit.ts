import { prisma } from './db';

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  userId?: string,
  details?: Record<string, any>
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId: userId || null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    console.error('Audit log creation failed:', err);
  }
}
