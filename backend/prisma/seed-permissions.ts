/**
 * Standalone Permission Seeder
 * Seeds only permissions and role→permission assignments
 * Can be run independently of main seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODULES = [
  "dashboard",
  "events",
  "banners",
  "gallery",
  "counters",
  "tests",
  "questions",
  "students",
  "results",
  "users",
  "blogs",
  "blog_categories",
  "testimonials",
  "teams",
  "partners",
  "contacts",
  "newsletter",
  "languages",
  "recycle_bin",
];

const ACTIONS = ["read", "create", "update", "delete"];

async function main() {
  console.log("📋 Seeding exam platform permissions...\n");

  // ─── 0. Seed basic roles ───
  const rolesData = [
    { name: "SUPER_ADMIN", isSystem: true, description: "Super Administrator" },
    { name: "ADMIN", isSystem: true, description: "Administrator" },
    { name: "STUDENT", isSystem: true, description: "Student User" },
  ];

  const roles: any = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roles[r.name] = role;
  }
  console.log("   ✅ Base Roles created");

  // ─── 1. Seed module permissions ───
  let count = 0;
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: {
          module,
          action,
          description: `Permission to ${action} ${module.replace("_", " ")}`,
        },
      });
      count++;
    }
  }

  // Special permissions
  const specialPerms = [
    { module: "results", action: "export", description: "Export exam results" },
    {
      module: "recycle_bin",
      action: "restore",
      description: "Restore deleted items",
    },
    {
      module: "recycle_bin",
      action: "permanent_delete",
      description: "Permanently delete items",
    },
    {
      module: "tests",
      action: "publish",
      description: "Publish/unpublish a test",
    },
  ];

  for (const sp of specialPerms) {
    await prisma.permission.upsert({
      where: { module_action: { module: sp.module, action: sp.action } },
      update: {},
      create: sp,
    });
    count++;
  }

  console.log(`✅ ${count} permissions seeded.\n`);

  // ─── 2. Assign permissions to roles ───
  console.log("👑 Assigning permissions to roles...\n");
  const allPerms = await prisma.permission.findMany();

  // SUPER_ADMIN → all permissions
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles["SUPER_ADMIN"].id,
          permissionId: perm.id,
        },
      },
      update: { granted: true },
      create: {
        roleId: roles["SUPER_ADMIN"].id,
        permissionId: perm.id,
        granted: true,
      },
    });
  }
  console.log("   ✅ SUPER_ADMIN: all permissions");

  // ADMIN → most permissions
  const adminDeny = ["users:delete", "recycle_bin:permanent_delete"];
  for (const perm of allPerms) {
    const key = `${perm.module}:${perm.action}`;
    const granted = !adminDeny.includes(key);
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles["ADMIN"].id,
          permissionId: perm.id,
        },
      },
      update: { granted },
      create: { roleId: roles["ADMIN"].id, permissionId: perm.id, granted },
    });
  }
  console.log("   ✅ ADMIN: most permissions");

  // STUDENT → limited
  const studentAllow = [
    "dashboard:read",
    "tests:read",
    "results:read",
    "contacts:create",
  ];
  for (const perm of allPerms) {
    const key = `${perm.module}:${perm.action}`;
    const granted = studentAllow.includes(key);
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles["STUDENT"].id,
          permissionId: perm.id,
        },
      },
      update: { granted },
      create: { roleId: roles["STUDENT"].id, permissionId: perm.id, granted },
    });
  }
  console.log("   ✅ STUDENT: limited permissions");

  console.log("\n🎉 Permission seeding complete!\n");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
