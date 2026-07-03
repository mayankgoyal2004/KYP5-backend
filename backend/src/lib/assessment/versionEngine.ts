import prisma from "../prisma.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Publishes an assessment by creating a complete frozen configuration snapshot.
 * The snapshot includes the test, mappings, groups, subgroups, group content,
 * questions, options, option scores, recommendation rules, and the report template configuration.
 */
export async function publishAssessment(testId: string, createdBy?: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the test details and linked report template
    const test = await tx.test.findUnique({
      where: { id: testId },
      include: {
        reportTemplate: {
          include: {
            sections: {
              where: { isActive: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!test || test.isDeleted) {
      throw ApiError.notFound("Test not found");
    }

    // 2. Fetch active group mappings and linked groups, subgroups, and group content
    const groupMappings = await tx.assessmentGroupMapping.findMany({
      where: { testId, isActive: true },
      include: {
        group: {
          include: {
            subGroups: { where: { isActive: true } },
            content: { where: { isActive: true } },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    if (groupMappings.length === 0) {
      throw ApiError.badRequest("Test must have at least one assessment group mapped before publishing");
    }

    const groupIds = groupMappings.map((m) => m.groupId);

    // 3. Fetch all active questions, options, and option scores mapped to the test
    const questions = await tx.question.findMany({
      where: { testId, isDeleted: false },
      orderBy: { order: "asc" },
      include: {
        translations: true,
        options: {
          orderBy: { order: "asc" },
          include: {
            translations: true,
            assessmentScores: {
              where: { groupId: { in: groupIds } },
              include: {
                group: true,
                subGroup: true,
              },
            },
          },
        },
      },
    });

    if (questions.length === 0) {
      throw ApiError.badRequest("Test must have at least one question before publishing");
    }

    const recommendationRules: any[] = [];

    // 5. Check latest version to determine the next version number
    const latestVersion = await tx.assessmentVersion.findFirst({
      where: { testId },
      orderBy: { version: "desc" },
    });

    const newVersionNum = (latestVersion?.version || 0) + 1;

    // 6. Deactivate any currently active versions for this test
    await tx.assessmentVersion.updateMany({
      where: { testId, isActive: true },
      data: { isActive: false },
    });

    // 7. Structure the comprehensive config snapshot
    const versionConfig = {
      test: {
        id: test.id,
        title: test.title,
        assessmentType: test.assessmentType,
        resultVisibility: test.resultVisibility,
        duration: test.duration,
        minAnswersRequired: test.minAnswersRequired,
        instructions: test.instructions,
        image: test.image,
        termsConditions: test.termsConditions,
        isActive: test.isActive,
        startDate: test.startDate,
        endDate: test.endDate,
        allowedAttempts: test.allowedAttempts,
        shuffleQuestions: test.shuffleQuestions,
        submissionMessage: test.submissionMessage,
        autoSubmit: test.autoSubmit,
        reportTemplateId: test.reportTemplateId,
      },
      groupMappings: groupMappings.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        order: m.order,
        weightMultiplier: m.weightMultiplier,
        isActive: m.isActive,
      })),
      groups: groupMappings.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        code: m.group.code,
        description: m.group.description,
        color: m.group.color,
        order: m.group.order,
      })),
      subGroups: groupMappings.flatMap((m) =>
        m.group.subGroups.map((sg) => ({
          id: sg.id,
          groupId: sg.groupId,
          name: sg.name,
          code: sg.code,
          description: sg.description,
          color: sg.color,
          order: sg.order,
        })),
      ),
      groupContents: groupMappings
        .map((m) => m.group.content)
        .filter(Boolean)
        .map((c: any) => ({
          id: c.id,
          groupId: c.groupId,
          title: c.title,
          shortSummary: c.shortSummary,
          longDescription: c.longDescription,
          strengths: c.strengths,
          weaknesses: c.weaknesses,
          recommendedStreams: c.recommendedStreams,
          recommendedCourses: c.recommendedCourses,
          recommendedCareers: c.recommendedCareers,
          developmentTips: c.developmentTips,
          learningStyle: c.learningStyle,
          workingStyle: c.workingStyle,
          warningAreas: c.warningAreas,
          recommendedTests: c.recommendedTests,
        })),
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        order: q.order,
        imageUrl: q.imageUrl,
        translations: q.translations.map((t) => ({
          languageId: t.languageId,
          text: t.text,
        })),
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          order: o.order,
          imageUrl: o.imageUrl,
          translations: o.translations.map((t) => ({
            languageId: t.languageId,
            text: t.text,
          })),
          assessmentScores: o.assessmentScores.map((s) => ({
            id: s.id,
            groupId: s.groupId,
            subGroupId: s.subGroupId,
            score: s.score,
          })),
        })),
      })),
      recommendationRules: [],
      reportTemplate: test.reportTemplate
        ? {
            id: test.reportTemplate.id,
            name: test.reportTemplate.name,
            coverTitle: test.reportTemplate.coverTitle,
            brandingConfig: test.reportTemplate.brandingConfig,
            sections: test.reportTemplate.sections.map((s) => ({
              id: s.id,
              sectionKey: s.sectionKey,
              title: s.title,
              order: s.order,
              config: s.config,
            })),
          }
        : null,
      capturedAt: new Date().toISOString(),
    };

    // 8. Write the new version snapshot
    const newVersion = await tx.assessmentVersion.create({
      data: {
        testId,
        version: newVersionNum,
        config: versionConfig,
        isActive: true,
        createdBy,
      },
    });

    return newVersion;
  });
}

/**
 * Unpublishes an assessment, locking it from receiving new student attempts.
 */
export async function unpublishAssessment(testId: string) {
  await prisma.assessmentVersion.updateMany({
    where: { testId, isActive: true },
    data: { isActive: false },
  });
}
