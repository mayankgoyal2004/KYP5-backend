import { evaluateRecommendationRules } from "./recommendationEngine.js";
import { buildGroupContentSnapshot } from "./contentEngine.js";

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
  const questions = attempt.test.questions;
  const answersByQuestion = new Map(
    attempt.userAnswers.map((answer: any) => [answer.questionId, answer]),
  );
  const optionIds = questions.flatMap((question: any) =>
    question.options.map((option: any) => option.id),
  );

  const mappings = await prismaClient.assessmentGroupMapping.findMany({
    where: {
      testId: attempt.testId,
      isActive: true,
    },
    include: { group: true },
    orderBy: { order: "asc" },
  });
  const mappedGroupIds = mappings.map((mapping: any) => mapping.groupId);
  const multipliers = new Map(
    mappings.map((mapping: any) => [mapping.groupId, Number(mapping.weightMultiplier || 1)]),
  );

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

  const { groupInfo, subGroupInfo } = buildGroupInfo(optionScores);
  const rawScores: Record<string, number> = {};
  const maxPossible: Record<string, number> = {};
  const subGroupScores: Record<string, number> = {};

  for (const question of questions) {
    const answer = answersByQuestion.get(question.id);
    const selectedOptionIds = getSelectedOptionIds(answer);

    for (const selectedOptionId of selectedOptionIds) {
      for (const score of scoresByOption.get(selectedOptionId) || []) {
        addScore(rawScores, score.groupId, Number(score.score) * (multipliers.get(score.groupId) || 1));
        if (score.subGroupId) {
          addScore(subGroupScores, score.subGroupId, Number(score.score) * (multipliers.get(score.groupId) || 1));
        }
      }
    }

    const bestByGroup: Record<string, number> = {};
    for (const option of question.options) {
      const optionGroupScores: Record<string, number> = {};
      for (const score of scoresByOption.get(option.id) || []) {
        addScore(optionGroupScores, score.groupId, Number(score.score) * (multipliers.get(score.groupId) || 1));
      }

      for (const [groupId, score] of Object.entries(optionGroupScores)) {
        bestByGroup[groupId] = Math.max(bestByGroup[groupId] || 0, score);
      }
    }

    for (const [groupId, score] of Object.entries(bestByGroup)) {
      addScore(maxPossible, groupId, score);
    }
  }

  const normalizedScores = Array.from(groupInfo.values()).map((group: any) => {
    const rawScore = rawScores[group.groupId] || 0;
    const possible = maxPossible[group.groupId] || 0;
    const percentage = possible > 0 ? roundToTwoDecimals((rawScore / possible) * 100) : 0;

    return {
      ...group,
      rawScore,
      maxPossible: possible,
      percentage,
    };
  });

  const rankedGroups = normalizedScores.sort((left: any, right: any) => {
    if (right.percentage !== left.percentage) return right.percentage - left.percentage;
    return left.order - right.order;
  });

  const subGroups = Array.from(subGroupInfo.values()).map((subGroup: any) => ({
    ...subGroup,
    rawScore: subGroupScores[subGroup.subGroupId] || 0,
  }));

  const rules = await prismaClient.assessmentRecommendationRule.findMany({
    where: {
      testId: attempt.testId,
      isActive: true,
    },
    orderBy: { priority: "asc" },
  });
  const recommendations = evaluateRecommendationRules(rules, rankedGroups);
  const topGroupIds = rankedGroups.slice(0, 3).map((group: any) => group.groupId);
  const groupContentSnapshot = await buildGroupContentSnapshot(prismaClient, topGroupIds);

  return {
    rawScores,
    normalizedScores,
    rankedGroups,
    subGroupScores: subGroups,
    primaryGroup: rankedGroups[0] || null,
    secondaryGroup: rankedGroups[1] || null,
    tertiaryGroup: rankedGroups[2] || null,
    recommendations,
    recommendationSummary: recommendations.map((item) => item.title).join(", ") || null,
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
