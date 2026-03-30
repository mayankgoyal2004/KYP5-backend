import prisma from "./prisma.js";
import logger from "../utils/logger.js";

/**
 * Check if a user has a specific permission.
 *
 * Priority:
 *   1. SUPER_ADMIN role always gets access
 *   2. UserPermission (per-user override) → if found, use its granted value
 *   3. RolePermission → if found, use its granted value
 *   4. Not found → DENY
 */
export async function checkPermission(
  userId: string,
  module: string,
  action: string,
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true, id: true } } },
    });

    if (!user) return false;

    // SUPER_ADMIN always has access
    if (user.role.name === "SUPER_ADMIN") {
      return true;
    }

    // Find the permission record
    const permission = await prisma.permission.findUnique({
      where: { module_action: { module, action } },
    });

    if (!permission) {
      logger.warn(`Permission not found: ${module}:${action}`);
      return false;
    }

    // 1. Check per-user override first
    const userOverride = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    if (userOverride !== null) {
      return userOverride.granted;
    }

    // 2. Fall back to role-level permission
    const rolePerm = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: user.role.id,
          permissionId: permission.id,
        },
      },
    });

    return rolePerm?.granted ?? false;
  } catch (error) {
    logger.error(
      `Permission check error for ${userId} ${module}:${action}: ${error}`,
    );
    return false;
  }
}

/**
 * Get all effective permissions for a user (used by frontend for UI rendering)
 */
export async function getUserEffectivePermissions(
  userId: string,
): Promise<{ module: string; action: string; granted: boolean }[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { id: true, name: true } } },
  });

  if (!user) return [];

  // SUPER_ADMIN gets all permissions granted
  if (user.role.name === "SUPER_ADMIN") {
    const allPermissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });
    return allPermissions.map((p) => ({
      module: p.module,
      action: p.action,
      granted: true,
    }));
  }

  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });

  // Get role-level permissions
  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId: user.role.id },
  });
  const roleMap = new Map(rolePerms.map((rp) => [rp.permissionId, rp.granted]));

  // Get user-level overrides
  const userOverrides = await prisma.userPermission.findMany({
    where: { userId },
  });
  const overrideMap = new Map(
    userOverrides.map((uo) => [uo.permissionId, uo.granted]),
  );

  return allPermissions.map((p) => {
    let granted = false;

    // User override takes precedence over role permission
    if (overrideMap.has(p.id)) {
      granted = overrideMap.get(p.id)!;
    } else if (roleMap.has(p.id)) {
      granted = roleMap.get(p.id)!;
    }

    return { module: p.module, action: p.action, granted };
  });
}

/**
 * Get all permissions grouped by module (for admin permission editor UI)
 */
export async function getPermissionsGroupedByModule() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });

  const grouped: Record<string, typeof permissions> = {};
  for (const p of permissions) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }

  return grouped;
}
