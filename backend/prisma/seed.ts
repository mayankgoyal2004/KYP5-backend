import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Exam Platform Database...\n");

  // ════════════════════════════════════════════════════════
  // 1. PERMISSIONS
  // ════════════════════════════════════════════════════════

  const ALL_PERMISSIONS = [
    { module: "dashboard", action: "read", description: "View dashboard" },
    { module: "courses", action: "read", description: "View courses" },
    { module: "courses", action: "create", description: "Create course" },
    { module: "courses", action: "update", description: "Update course" },
    { module: "courses", action: "delete", description: "Delete course" },
    { module: "tests", action: "read", description: "View tests" },
    { module: "tests", action: "create", description: "Create test" },
    { module: "tests", action: "update", description: "Update test" },
    { module: "tests", action: "delete", description: "Delete test" },
    { module: "questions", action: "read", description: "View questions" },
    { module: "questions", action: "create", description: "Create question" },
    { module: "questions", action: "update", description: "Update question" },
    { module: "questions", action: "delete", description: "Delete question" },
    { module: "students", action: "read", description: "View students" },
    { module: "students", action: "create", description: "Create student" },
    { module: "students", action: "update", description: "Update student" },
    { module: "students", action: "delete", description: "Delete student" },
    { module: "results", action: "read", description: "View results" },
    { module: "users", action: "read", description: "View admin users" },
    { module: "users", action: "create", description: "Create admin user" },
    { module: "users", action: "update", description: "Update admin user" },
    { module: "users", action: "delete", description: "Delete admin user" },
    { module: "blogs", action: "read", description: "View blogs" },
    { module: "blogs", action: "create", description: "Create blog" },
    { module: "blogs", action: "update", description: "Update blog" },
    { module: "blogs", action: "delete", description: "Delete blog" },
    {
      module: "testimonials",
      action: "read",
      description: "View testimonials",
    },
    {
      module: "testimonials",
      action: "create",
      description: "Create testimonial",
    },
    {
      module: "testimonials",
      action: "update",
      description: "Update testimonial",
    },
    {
      module: "testimonials",
      action: "delete",
      description: "Delete testimonial",
    },
    { module: "contacts", action: "read", description: "View contacts" },
    { module: "contacts", action: "delete", description: "Delete contacts" },
    {
      module: "newsletter",
      action: "read",
      description: "View newsletter subscribers",
    },
    {
      module: "newsletter",
      action: "update",
      description: "Update newsletter subscribers",
    },
    {
      module: "newsletter",
      action: "delete",
      description: "Delete newsletter subscribers",
    },
    { module: "teams", action: "read", description: "View team members" },
    { module: "teams", action: "create", description: "Create team member" },
    { module: "teams", action: "update", description: "Update team member" },
    { module: "teams", action: "delete", description: "Delete team member" },
    { module: "partners", action: "read", description: "View partners" },
    { module: "partners", action: "create", description: "Create partner" },
    { module: "partners", action: "update", description: "Update partner" },
    { module: "partners", action: "delete", description: "Delete partner" },
    { module: "gallery", action: "read", description: "View gallery" },
    { module: "gallery", action: "create", description: "Create gallery item" },
    { module: "gallery", action: "update", description: "Update gallery item" },
    { module: "gallery", action: "delete", description: "Delete gallery item" },
    { module: "events", action: "read", description: "View events" },
    { module: "events", action: "create", description: "Create event" },
    { module: "events", action: "update", description: "Update event" },
    { module: "events", action: "delete", description: "Delete event" },
    { module: "recycle_bin", action: "read", description: "View recycle bin" },
    { module: "recycle_bin", action: "restore", description: "Restore items" },
    {
      module: "recycle_bin",
      action: "permanent_delete",
      description: "Permanently delete",
    },
  ];

  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ ${ALL_PERMISSIONS.length} permissions seeded`);

  // ════════════════════════════════════════════════════════
  // 1b. ROLES
  // ════════════════════════════════════════════════════════

  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { isSystem: true },
    create: {
      name: "SUPER_ADMIN",
      isSystem: true,
      description: "Unrestricted access",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: { isSystem: true },
    create: {
      name: "ADMIN",
      isSystem: true,
      description: "Standard administrator",
    },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: "STUDENT" },
    update: { isSystem: true },
    create: {
      name: "STUDENT",
      isSystem: true,
      description: "Platform student user",
    },
  });

  console.log(`✅ Roles seeded`);

  // ════════════════════════════════════════════════════════
  // 2. ROLE PERMISSIONS
  // ════════════════════════════════════════════════════════

  const allPerms = await prisma.permission.findMany();

  // SUPER_ADMIN gets everything explicitly via checkPermission, but we'll seed anyway
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: { granted: true },
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
        granted: true,
      },
    });
  }

  // ADMIN gets most
  const adminDeny = ["users:delete", "recycle_bin:permanent_delete"];
  for (const perm of allPerms) {
    const key = `${perm.module}:${perm.action}`;
    const granted = !adminDeny.includes(key);
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: { granted },
      create: { roleId: adminRole.id, permissionId: perm.id, granted },
    });
  }

  console.log("✅ Role permissions assigned");

  // ════════════════════════════════════════════════════════
  // 3. USERS (Admin + Students)
  // ════════════════════════════════════════════════════════

  const defaultPwd = await bcrypt.hash("Password@123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@gmail.com",
      phone: "9999900001",
      password: defaultPwd,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  const studentsData = [
    { name: "Rahul Sharma", email: "rahul@student.com", rollNumber: "STU001" },
    { name: "Priya Singh", email: "priya@student.com", rollNumber: "STU002" },
  ];

  for (const s of studentsData) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        ...s,
        password: defaultPwd,
        roleId: studentRole.id,
        isActive: true,
      },
    });
  }
  console.log(`✅ Admin and ${studentsData.length} students created`);

  // ════════════════════════════════════════════════════════
  // 4. COURSES & TESTS
  // ════════════════════════════════════════════════════════

  const course = await prisma.course.upsert({
    where: { id: "seed-course-1" },
    update: {},
    create: {
      id: "seed-course-1",
      title: "General Aptitude",
      description: "Basic aptitude and reasoning",
      isActive: true,
    },
  });

  const test = await prisma.test.upsert({
    where: { id: "seed-test-1" },
    update: {},
    create: {
      id: "seed-test-1",
      title: "Reasoning Mock Test",
      courseId: course.id,
      duration: 30,
      totalQuestions: 2,
      totalMarks: 4,
      passingScore: 50,
      instructions: "Solve all questions.",
      termsConditions: "No cheating.",
      isActive: true,
      allowedAttempts: 3,
    },
  });

  // Adding sample questions
  const qCount = await prisma.question.count({ where: { testId: test.id } });
  if (qCount === 0) {
    await prisma.question.create({
      data: {
        testId: test.id,
        text: "What comes next in the sequence: 2, 4, 8, 16, ___?",
        order: 1,
        marks: 2,
        options: {
          create: [
            { text: "24", isCorrect: false, order: 1 },
            { text: "32", isCorrect: true, order: 2 },
          ],
        },
      },
    });
    console.log("✅ Seed questions created");
  }

  // ════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════
  console.log("\n🎉 Database seeded successfully!");
  console.log("Super Admin: admin@examportal.com / Password@123");
  console.log("Student: rahul@student.com / Password@123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
