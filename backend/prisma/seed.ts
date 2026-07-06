import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Exam Platform Database...\n");

  // ════════════════════════════════════════════════════c════
  // 1. PERMISSIONS
  // ════════════════════════════════════════════════════════

  const ALL_PERMISSIONS = [
    { module: "dashboard", action: "read", description: "View dashboard" },

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
    { module: "languages", action: "read", description: "View languages" },
    { module: "languages", action: "create", description: "Create language" },
    { module: "languages", action: "update", description: "Update language" },
    { module: "languages", action: "delete", description: "Delete language" },
    { module: "teams", action: "read", description: "View team members" },
    { module: "teams", action: "create", description: "Create team member" },
    { module: "teams", action: "update", description: "Update team member" },
    { module: "teams", action: "delete", description: "Delete team member" },
    { module: "partners", action: "read", description: "View partners" },
    { module: "partners", action: "create", description: "Create partner" },
    { module: "partners", action: "update", description: "Update partner" },
    { module: "partners", action: "delete", description: "Delete partner" },
    { module: "services", action: "read", description: "View services page" },
    {
      module: "services",
      action: "create",
      description: "Create services page",
    },
    {
      module: "services",
      action: "update",
      description: "Update services page",
    },
    {
      module: "services",
      action: "delete",
      description: "Delete services page",
    },
    { module: "counters", action: "read", description: "View counters" },
    { module: "counters", action: "create", description: "Create counter" },
    { module: "counters", action: "update", description: "Update counter" },
    { module: "counters", action: "delete", description: "Delete counter" },
    { module: "gallery", action: "read", description: "View gallery" },
    { module: "gallery", action: "create", description: "Create gallery item" },
    { module: "gallery", action: "update", description: "Update gallery item" },
    { module: "gallery", action: "delete", description: "Delete gallery item" },
    { module: "banners", action: "read", description: "View banners" },
    { module: "banners", action: "create", description: "Create banner" },
    { module: "banners", action: "update", description: "Update banner" },
    { module: "banners", action: "delete", description: "Delete banner" },
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
    // Assessment permissions
    {
      module: "assessment_groups",
      action: "read",
      description: "View assessment groups",
    },
    {
      module: "assessment_groups",
      action: "create",
      description: "Create assessment group",
    },
    {
      module: "assessment_groups",
      action: "update",
      description: "Update assessment group",
    },
    {
      module: "assessment_groups",
      action: "delete",
      description: "Delete assessment group",
    },
    {
      module: "assessment_sub_groups",
      action: "read",
      description: "View assessment sub groups",
    },
    {
      module: "assessment_sub_groups",
      action: "create",
      description: "Create assessment sub group",
    },
    {
      module: "assessment_sub_groups",
      action: "update",
      description: "Update assessment sub group",
    },
    {
      module: "assessment_sub_groups",
      action: "delete",
      description: "Delete assessment sub group",
    },
    {
      module: "option_weights",
      action: "read",
      description: "View option weights",
    },
    {
      module: "option_weights",
      action: "create",
      description: "Create option weights",
    },
    {
      module: "option_weights",
      action: "update",
      description: "Update option weights",
    },
    {
      module: "option_weights",
      action: "delete",
      description: "Delete option weights",
    },
    {
      module: "report_templates",
      action: "read",
      description: "View report templates",
    },
    {
      module: "report_templates",
      action: "create",
      description: "Create report template",
    },
    {
      module: "report_templates",
      action: "update",
      description: "Update report template",
    },
    {
      module: "report_templates",
      action: "delete",
      description: "Delete report template",
    },
    {
      module: "test_recommendations",
      action: "read",
      description: "View test recommendations",
    },
    {
      module: "test_recommendations",
      action: "create",
      description: "Create test recommendation",
    },
    {
      module: "test_recommendations",
      action: "update",
      description: "Update test recommendation",
    },
    {
      module: "test_recommendations",
      action: "delete",
      description: "Delete test recommendation",
    },
    { module: "reports", action: "read", description: "View reports" },
    { module: "reports", action: "create", description: "Create report" },
    { module: "reports", action: "update", description: "Update report" },
    { module: "reports", action: "delete", description: "Delete report" },
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

  const baseLanguages = [
    { code: "en", name: "English", isRtl: false },
    { code: "hi", name: "Hindi", isRtl: false },
    { code: "pu", name: "Punjabi", isRtl: false },
  ];

  for (const language of baseLanguages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {
        name: language.name,
        isRtl: language.isRtl,
        isActive: true,
      },
      create: {
        ...language,
        isActive: true,
      },
    });
  }

  const englishLanguage = await prisma.language.findUnique({
    where: { code: "en" },
  });
  const hindiLanguage = await prisma.language.findUnique({
    where: { code: "hi" },
  });

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
    { name: "Rahul Sharma", email: "rahul@student.com" },
    { name: "Priya Singh", email: "priya@student.com" },
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
  // 4. REPORT TEMPLATE
  // ════════════════════════════════════════════════════════

  const defaultTemplate = await prisma.reportTemplate.upsert({
    where: { id: "seed-report-template-1" },
    update: {
      name: "Standard Stream Finder Template",
      coverTitle: "STREAM IDENTIFIER",
      page7Heading: "Domain Aptitude Assessment based on Intrinsic Factors",
      isActive: true,
      brandingConfig: {
        logoUrl: "/assets/main-logo-CLlNxqg9.png",
        phone1: "+91 85688 05400",
        phone2: "+91 98788 53633",
        email: "info@kyp5.com"
      }
    },
    create: {
      id: "seed-report-template-1",
      name: "Standard Stream Finder Template",
      coverTitle: "STREAM IDENTIFIER",
      page7Heading: "Domain Aptitude Assessment based on Intrinsic Factors",
      isActive: true,
      brandingConfig: {
        logoUrl: "/assets/main-logo-CLlNxqg9.png",
        phone1: "+91 85688 05400",
        phone2: "+91 98788 53633",
        email: "info@kyp5.com"
      }
    }
  });

  // ════════════════════════════════════════════════════════
  // 5. ASSESSMENT GROUPS
  // ════════════════════════════════════════════════════════

  const groupsToSeed = [
    {
      name: "Commerce",
      code: "COMMERCE",
      color: "#0070c9",
      groupCluster: "Financial Operations Cluster",
      description: "Strong analytical and commercial skills. Includes career pathways like banking, finance, accountancy, business management, and administration."
    },
    {
      name: "Humanities",
      code: "HUMANITIES",
      color: "#d10000",
      groupCluster: "People Oriented Career Cluster",
      description: "Creative and artistic abilities. Focuses on social studies, history, political science, literature, performing arts, and fine arts."
    },
    {
      name: "Science PCB",
      code: "SCIENCE_PCB",
      color: "#ffc000",
      groupCluster: "Clinical & Health Services",
      description: "Medical and biological sciences. Best suited for careers in medicine, dentistry, pharmacy, botany, zoology, and environmental studies."
    },
    {
      name: "Science PCM",
      code: "SCIENCE_PCM",
      color: "#00b050",
      groupCluster: "Technical & Applied Sciences",
      description: "Non-medical, engineering, physics, math. Opens pathways in software development, architecture, physics, statistics, and mathematics."
    }
  ];

  const groupMap = new Map<string, string>();
  for (const group of groupsToSeed) {
    const dbg = await prisma.assessmentGroup.upsert({
      where: { code: group.code },
      update: {
        name: group.name,
        color: group.color,
        groupCluster: group.groupCluster,
        description: group.description
      },
      create: {
        name: group.name,
        code: group.code,
        color: group.color,
        groupCluster: group.groupCluster,
        description: group.description
      }
    });
    groupMap.set(group.code, dbg.id);
  }

  // ════════════════════════════════════════════════════════
  // 6. ASSESSMENT SUBGROUPS
  // ════════════════════════════════════════════════════════

  const subgroupsToSeed = [
    // Humanities Subgroups
    { groupCode: "HUMANITIES", name: "Teaching", code: "TEACHING", description: "School Teacher, College/University Professor, Trainer" },
    { groupCode: "HUMANITIES", name: "Management", code: "MANAGEMENT", description: "Human Resource Manager, Sales & Marketing Manager" },
    { groupCode: "HUMANITIES", name: "Design", code: "DESIGN", description: "Fashion Designer, Textile Designer, Interior Designer, Graphic Designer, Jewelry Designer, Set Designer" },
    { groupCode: "HUMANITIES", name: "Fine Arts", code: "FINE_ARTS", description: "Artist, Layout Designer, Web Designer, Graphic Designer, Animator, Illustrator," },

    // Commerce Subgroups
    { groupCode: "COMMERCE", name: "Banking", code: "BANKING", description: "Bank Manager, Loan Officer, Investment Banker" },
    { groupCode: "COMMERCE", name: "Accountancy", code: "ACCOUNTANCY", description: "Chartered Accountant, Auditor, Tax Consultant" },
    { groupCode: "COMMERCE", name: "Business Analytics", code: "BUSINESS_ANALYTICS", description: "Data Analyst, Business Strategist, Market Researcher" },

    // Science PCB Subgroups
    { groupCode: "SCIENCE_PCB", name: "Medicine", code: "MEDICINE", description: "Physician, Surgeon, Pediatrician, Cardiologist" },
    { groupCode: "SCIENCE_PCB", name: "Dentistry", code: "DENTISTRY", description: "Dentist, Orthodontist, Periodontist" },
    { groupCode: "SCIENCE_PCB", name: "Biotechnology", code: "BIOTECH", description: "Research Scientist, Geneticist, Microbiologist" },

    // Science PCM Subgroups
    { groupCode: "SCIENCE_PCM", name: "Engineering", code: "ENGINEERING", description: "Mechanical, Civil, Electrical, Aerospace Engineer" },
    { groupCode: "SCIENCE_PCM", name: "Software Development", code: "SOFTWARE_DEV", description: "Software Engineer, Full Stack Developer, Systems Analyst" },
    { groupCode: "SCIENCE_PCM", name: "Statistics", code: "STATISTICS", description: "Statistician, Actuary, Quantitative Analyst" }
  ];

  for (const sg of subgroupsToSeed) {
    const groupId = groupMap.get(sg.groupCode);
    if (!groupId) continue;

    await prisma.assessmentSubGroup.upsert({
      where: { groupId_code: { groupId, code: sg.code } },
      update: {
        name: sg.name,
        description: sg.description,
        isActive: true
      },
      create: {
        groupId,
        name: sg.name,
        code: sg.code,
        description: sg.description,
        isActive: true
      }
    });
  }

  // ════════════════════════════════════════════════════════
  // 7. STREAM FINDER TEST
  // ════════════════════════════════════════════════════════

  const streamFinderTest = await prisma.test.upsert({
    where: { id: "test-stream-finder-1" },
    update: {
      title: "STREAM IDENTIFIER",
      duration: 45,
      minAnswersRequired: 1,
      reportTemplateId: "seed-report-template-1",
      instructions: "Choose the answer that fits you best.",
      termsConditions: "Agreement terms.",
      isActive: true
    },
    create: {
      id: "test-stream-finder-1",
      title: "STREAM IDENTIFIER",
      duration: 45,
      minAnswersRequired: 1,
      reportTemplateId: "seed-report-template-1",
      instructions: "Choose the answer that fits you best.",
      termsConditions: "Agreement terms.",
      isActive: true
    }
  });

  // ════════════════════════════════════════════════════════
  // 8. ASSESSMENT GROUP MAPPINGS
  // ════════════════════════════════════════════════════════

  const mappingsToSeed = [
    { testId: "test-stream-finder-1", groupCode: "COMMERCE", order: 0 },
    { testId: "test-stream-finder-1", groupCode: "HUMANITIES", order: 1 },
    { testId: "test-stream-finder-1", groupCode: "SCIENCE_PCB", order: 2 },
    { testId: "test-stream-finder-1", groupCode: "SCIENCE_PCM", order: 3 }
  ];

  for (const m of mappingsToSeed) {
    const groupId = groupMap.get(m.groupCode);
    if (!groupId) continue;

    await prisma.assessmentGroupMapping.upsert({
      where: { testId_groupId: { testId: m.testId, groupId } },
      update: { order: m.order, weightMultiplier: 1.0, isActive: true },
      create: { testId: m.testId, groupId, order: m.order, weightMultiplier: 1.0, isActive: true }
    });
  }

  // ════════════════════════════════════════════════════════
  // 9. QUESTIONS, OPTIONS, AND OPTION SCORES
  // ════════════════════════════════════════════════════════

  const questionsData = [
    {
      id: "q-commerce",
      text: "Do you enjoy analyzing data, financial accounts, and commercial information?",
      order: 0,
      groupCode: "COMMERCE",
      primarySubgroupCode: "BANKING",
      secondarySubgroupCode: "ACCOUNTANCY"
    },
    {
      id: "q-humanities",
      text: "Are you interested in drawing, fine arts, layouts, or teaching others?",
      order: 1,
      groupCode: "HUMANITIES",
      primarySubgroupCode: "TEACHING",
      secondarySubgroupCode: "DESIGN"
    },
    {
      id: "q-science-pcb",
      text: "Do you like learning about anatomy, plant life, botany, and medical science?",
      order: 2,
      groupCode: "SCIENCE_PCB",
      primarySubgroupCode: "MEDICINE",
      secondarySubgroupCode: "BIOTECH"
    },
    {
      id: "q-science-pcm",
      text: "Do you love solving equations, coding, physics, and calculus problems?",
      order: 3,
      groupCode: "SCIENCE_PCM",
      primarySubgroupCode: "ENGINEERING",
      secondarySubgroupCode: "SOFTWARE_DEV"
    }
  ];

  for (const q of questionsData) {
    const groupId = groupMap.get(q.groupCode);
    if (!groupId) continue;

    // Upsert Question
    const dbQuestion = await prisma.question.upsert({
      where: { id: q.id },
      update: { text: q.text, order: q.order },
      create: { id: q.id, testId: "test-stream-finder-1", text: q.text, order: q.order }
    });

    // Seed options
    const optionTexts = [
      { text: "Strongly Agree", scoreMult: 1.0 },
      { text: "Agree", scoreMult: 0.5 },
      { text: "Disagree", scoreMult: 0.0 }
    ];

    for (let oIdx = 0; oIdx < optionTexts.length; oIdx++) {
      const opt = optionTexts[oIdx];
      const optId = `${q.id}-opt-${oIdx}`;

      // Upsert option
      await prisma.option.upsert({
        where: { id: optId },
        update: { text: opt.text, order: oIdx },
        create: { id: optId, questionId: dbQuestion.id, text: opt.text, order: oIdx }
      });

      // Query subgroup IDs for scoring
      const sub1 = await prisma.assessmentSubGroup.findUnique({
        where: { groupId_code: { groupId, code: q.primarySubgroupCode } }
      });
      const sub2 = await prisma.assessmentSubGroup.findUnique({
        where: { groupId_code: { groupId, code: q.secondarySubgroupCode } }
      });

      // Upsert option weights (scores) for the option
      // Score for Primary Subgroup
      if (sub1) {
        const scoreId1 = `${optId}-score-1`;
        await prisma.assessmentOptionScore.upsert({
          where: { id: scoreId1 },
          update: { score: 10 * opt.scoreMult },
          create: {
            id: scoreId1,
            optionId: optId,
            groupId,
            subGroupId: sub1.id,
            score: 10 * opt.scoreMult
          }
        });
      }

      // Score for Secondary Subgroup
      if (sub2) {
        const scoreId2 = `${optId}-score-2`;
        await prisma.assessmentOptionScore.upsert({
          where: { id: scoreId2 },
          update: { score: 5 * opt.scoreMult },
          create: {
            id: scoreId2,
            optionId: optId,
            groupId,
            subGroupId: sub2.id,
            score: 5 * opt.scoreMult
          }
        });
      }
    }
  }

  // ════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════
  console.log("\n🎉 Database seeded successfully!");
  console.log("Super Admin: admin@gmail.com / Password@123");
  console.log("Student: rahul@student.com / Password@123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
