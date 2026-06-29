export async function buildGroupContentSnapshot(
  prismaClient: any,
  groupIds: string[],
) {
  if (groupIds.length === 0) return [];

  const contents = await prismaClient.groupContent.findMany({
    where: {
      groupId: { in: groupIds },
      isActive: true,
    },
    include: {
      group: true,
    },
  });

  return contents.map((content: any) => ({
    groupId: content.groupId,
    groupSlug: content.group.slug,
    groupName: content.group.name,
    title: content.title,
    shortSummary: content.shortSummary,
    longDescription: content.longDescription,
    strengths: content.strengths,
    weaknesses: content.weaknesses,
    recommendedStreams: content.recommendedStreams,
    recommendedCourses: content.recommendedCourses,
    recommendedCareers: content.recommendedCareers,
    developmentTips: content.developmentTips,
    learningStyle: content.learningStyle,
    workingStyle: content.workingStyle,
    warningAreas: content.warningAreas,
    recommendedTests: content.recommendedTests,
  }));
}
