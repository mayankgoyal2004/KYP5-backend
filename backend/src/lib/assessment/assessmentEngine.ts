import { buildGroupContentSnapshot } from "./contentEngine.js";

function getRecommendationsFromGroupContent(groupContent: any) {
  if (!groupContent) return [];
  const recommendations: any[] = [];

  // Extract Courses
  const courses = Array.isArray(groupContent.recommendedCourses)
    ? groupContent.recommendedCourses
    : [];
  courses.forEach((course: any, idx: number) => {
    if (course) {
      recommendations.push({
        id: `course-${idx}`,
        type: "COURSE",
        title: typeof course === "string" ? course : course.name || course.title || "",
        description: course.description || `Recommended Course based on your profile`,
        priority: idx + 1,
      });
    }
  });

  // Extract Careers
  const careers = Array.isArray(groupContent.recommendedCareers)
    ? groupContent.recommendedCareers
    : [];
  careers.forEach((career: any, idx: number) => {
    if (career) {
      recommendations.push({
        id: `career-${idx}`,
        type: "CAREER",
        title: typeof career === "string" ? career : career.name || career.title || "",
        description: career.description || `Recommended Career matching your strengths`,
        priority: idx + 1,
      });
    }
  });

  // Extract Streams
  const streams = Array.isArray(groupContent.recommendedStreams)
    ? groupContent.recommendedStreams
    : [];
  streams.forEach((stream: any, idx: number) => {
    if (stream) {
      recommendations.push({
        id: `stream-${idx}`,
        type: "STREAM",
        title: typeof stream === "string" ? stream : stream.name || stream.title || "",
        description: stream.description || `Recommended academic stream`,
        priority: idx + 1,
      });
    }
  });

  // Extract Custom Recommendations
  const customRecs = Array.isArray(groupContent.recommendations)
    ? groupContent.recommendations
    : [];
  customRecs.forEach((rec: any, idx: number) => {
    if (rec) {
      recommendations.push({
        id: `custom-${idx}`,
        type: "CUSTOM",
        title: typeof rec === "string" ? rec : rec.title || rec.name || "",
        description: rec.description || `Additional recommendation based on your profile`,
        priority: idx + 1,
      });
    }
  });

  return recommendations;
}

function roundToTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}

function addScore(bucket: Record<string, number>, key: string, score: number) {
  bucket[key] = roundToTwoDecimals((bucket[key] || 0) + score);
}

function getSelectedOptionIds(answer: any) {
  if (answer?.selectedOptionId) return [answer.selectedOptionId];
  return [];
}

function buildGroupInfo(scores: any[]) {
  const groupInfo = new Map<string, any>();
  const subGroupInfo = new Map<string, any>();

  for (const score of scores) {
    groupInfo.set(score.groupId, {
      groupId: score.groupId,
      slug: score.group.slug,
      name: score.group.name,
      color: score.group.color,
      description: score.group.description,
      order: score.group.order,
    });

    if (score.subGroup) {
      subGroupInfo.set(score.subGroupId, {
        subGroupId: score.subGroupId,
        groupId: score.groupId,
        slug: score.subGroup.slug,
        name: score.subGroup.name,
        color: score.subGroup.color,
        description: score.subGroup.description,
        order: score.subGroup.order,
      });
    }
  }

  return { groupInfo, subGroupInfo };
}

export async function ensureAssessmentVersion(prismaClient: any, testId: string) {
  const existing = await prismaClient.assessmentVersion.findFirst({
    where: { testId, isActive: true },
    orderBy: { version: "desc" },
  });

  if (existing) return existing;

  const [latest, test] = await Promise.all([
    prismaClient.assessmentVersion.findFirst({
      where: { testId },
      orderBy: { version: "desc" },
    }),
    prismaClient.test.findUnique({
      where: { id: testId },
      include: {
        assessmentGroupMappings: {
          where: { isActive: true },
          include: { group: true },
          orderBy: { order: "asc" },
        },
        questions: {
          where: { isDeleted: false },
          orderBy: { order: "asc" },
          include: {
            options: {
              orderBy: { order: "asc" },
              include: {
                assessmentScores: {
                  include: { group: true, subGroup: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const version = (latest?.version || 0) + 1;
  return prismaClient.assessmentVersion.create({
    data: {
      testId,
      version,
      isActive: true,
      config: {
        testId,
        assessmentType: test?.assessmentType,
        groupMappings: test?.assessmentGroupMappings || [],
        questions: test?.questions || [],
        capturedAt: new Date().toISOString(),
      },
    },
  });
}

export async function calculateAssessmentResult(prismaClient: any, attempt: any) {
  const version = attempt.assessmentVersion;
  const answersByQuestion = new Map(
    attempt.userAnswers.map((answer: any) => [answer.questionId, answer]),
  );

  let questions: any[] = [];
  let groupMappings: any[] = [];
  let groups: any[] = [];
  let subGroups: any[] = [];
  let recommendationRules: any[] = [];
  let groupContents: any[] = [];
  const rawScores: Record<string, number> = {};
  const maxPossible: Record<string, number> = {};
  const subGroupScores: Record<string, number> = {};

  if (version && version.config) {
    const config = version.config as any;
    questions = config.questions || [];
    groupMappings = config.groupMappings || [];
    groups = config.groups || [];
    subGroups = config.subGroups || [];
    recommendationRules = config.recommendationRules || [];
    groupContents = config.groupContents || [];
  } else {
    // FALLBACK: Query from live database tables (backward compatibility / legacy attempts)
    questions = attempt.test.questions;
    const optionIds = questions.flatMap((question: any) =>
      question.options.map((option: any) => option.id),
    );

    groupMappings = await prismaClient.assessmentGroupMapping.findMany({
      where: {
        testId: attempt.testId,
        isActive: true,
      },
      include: { group: true },
      orderBy: { order: "asc" },
    });

    const mappedGroupIds = groupMappings.map((mapping: any) => mapping.groupId);
    const optionScores = await prismaClient.assessmentOptionScore.findMany({
      where: {
        optionId: { in: optionIds },
        groupId: { in: mappedGroupIds },
      },
      include: {
        group: true,
        subGroup: true,
      },
    });

    const scoresByOption = new Map<string, any[]>();
    for (const score of optionScores) {
      if (!scoresByOption.has(score.optionId)) scoresByOption.set(score.optionId, []);
      scoresByOption.get(score.optionId)!.push(score);
    }

    questions = questions.map((q: any) => ({
      ...q,
      options: q.options.map((o: any) => ({
        ...o,
        assessmentScores: scoresByOption.get(o.id) || [],
      })),
    }));

    const { groupInfo, subGroupInfo } = buildGroupInfo(optionScores);
    groups = Array.from(groupInfo.values()).map((g: any) => ({
      id: g.groupId,
      name: g.name,
      code: g.slug,
      color: g.color,
      description: g.description,
      order: g.order,
    }));

    subGroups = Array.from(subGroupInfo.values()).map((sg: any) => ({
      id: sg.subGroupId,
      groupId: sg.groupId,
      name: sg.name,
      code: sg.slug,
      color: sg.color,
      description: sg.description,
      order: sg.order,
    }));

    recommendationRules = [];
  }

  const multipliers = new Map(
    groupMappings.map((mapping: any) => [
      mapping.groupId,
      Number(mapping.weightMultiplier || 1),
    ]),
  );

  for (const question of questions) {
    const answer = answersByQuestion.get(question.id);
    const selectedOptionIds = getSelectedOptionIds(answer);

    for (const selectedOptionId of selectedOptionIds) {
      const option = question.options.find((o: any) => o.id === selectedOptionId);
      if (option) {
        for (const score of option.assessmentScores || []) {
          const mult = multipliers.get(score.groupId) || 1;
          addScore(rawScores, score.groupId, Number(score.score) * mult);
          if (score.subGroupId) {
            addScore(subGroupScores, score.subGroupId, Number(score.score) * mult);
          }
        }
      }
    }

    const bestByGroup: Record<string, number> = {};
    for (const option of question.options) {
      const optionGroupScores: Record<string, number> = {};
      for (const score of option.assessmentScores || []) {
        const mult = multipliers.get(score.groupId) || 1;
        addScore(optionGroupScores, score.groupId, Number(score.score) * mult);
      }

      for (const [groupId, score] of Object.entries(optionGroupScores)) {
        bestByGroup[groupId] = Math.max(bestByGroup[groupId] || 0, score);
      }
    }

    for (const [groupId, score] of Object.entries(bestByGroup)) {
      addScore(maxPossible, groupId, score);
    }
  }

  const normalizedScores = groups.map((group: any) => {
    const groupId = group.id || group.groupId;
    const rawScore = rawScores[groupId] || 0;
    const possible = maxPossible[groupId] || 0;
    const percentage = possible > 0 ? roundToTwoDecimals((rawScore / possible) * 100) : 0;

    return {
      groupId,
      slug: group.code || group.slug,
      name: group.name,
      groupCluster: group.groupCluster,
      color: group.color,
      description: group.description,
      order: group.order,
      rawScore,
      maxPossible: possible,
      percentage,
    };
  });

  const rankedGroups = normalizedScores.sort((left: any, right: any) => {
    if (right.percentage !== left.percentage) return right.percentage - left.percentage;
    return left.order - right.order;
  });

  const subGroupScoresMapped = subGroups.map((subGroup: any) => {
    const subGroupId = subGroup.id || subGroup.subGroupId;
    return {
      subGroupId,
      groupId: subGroup.groupId,
      slug: subGroup.code || subGroup.slug,
      name: subGroup.name,
      color: subGroup.color,
      description: subGroup.description,
      order: subGroup.order,
      rawScore: subGroupScores[subGroupId] || 0,
    };
  });

  const topGroupIds = rankedGroups.slice(0, 3).map((group: any) => group.groupId);
  const groupContentSnapshot: any[] = [];
  const recommendations: any[] = [];

  return {
    rawScores,
    normalizedScores,
    rankedGroups,
    subGroupScores: subGroupScoresMapped,
    primaryGroup: rankedGroups[0] || null,
    secondaryGroup: rankedGroups[1] || null,
    tertiaryGroup: rankedGroups[2] || null,
    recommendations,
    recommendationSummary: recommendations.map((item: any) => item.title).join(", ") || null,
    groupContentSnapshot,
    totalQuestions: questions.length,
    attemptedCount: attempt.userAnswers.filter((answer: any) => answer.isAnswered).length,
  };
}

export async function saveAssessmentResult(
  tx: any,
  attemptId: string,
  result: Awaited<ReturnType<typeof calculateAssessmentResult>>,
) {
  return tx.assessmentResultSnapshot.upsert({
    where: { attemptId },
    update: {
      rawScores: result.rawScores,
      normalizedScores: result.normalizedScores,
      rankedGroups: result.rankedGroups,
      subGroupScores: result.subGroupScores,
      primaryGroup: result.primaryGroup,
      secondaryGroup: result.secondaryGroup,
      tertiaryGroup: result.tertiaryGroup,
      recommendations: result.recommendations,
      recommendationSummary: result.recommendationSummary,
      groupContentSnapshot: result.groupContentSnapshot,
      reportStatus: "PROCESSING",
      generatedAt: new Date(),
    },
    create: {
      attemptId,
      rawScores: result.rawScores,
      normalizedScores: result.normalizedScores,
      rankedGroups: result.rankedGroups,
      subGroupScores: result.subGroupScores,
      primaryGroup: result.primaryGroup,
      secondaryGroup: result.secondaryGroup,
      tertiaryGroup: result.tertiaryGroup,
      recommendations: result.recommendations,
      recommendationSummary: result.recommendationSummary,
      groupContentSnapshot: result.groupContentSnapshot,
      reportStatus: "PROCESSING",
    },
  });
}
