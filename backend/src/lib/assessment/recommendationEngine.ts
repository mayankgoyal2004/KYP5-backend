type RankedGroup = {
  groupId: string;
  slug: string;
  name: string;
  percentage: number;
  rawScore: number;
  maxPossible: number;
};

type Rule = {
  id: string;
  title: string;
  description?: string | null;
  priority: number;
  recommendedTestId?: string | null;
  conditions: any;
};

function compare(value: number, operator: string, expected: number) {
  switch (operator) {
    case ">":
      return value > expected;
    case ">=":
      return value >= expected;
    case "<":
      return value < expected;
    case "<=":
      return value <= expected;
    case "=":
    case "==":
      return value === expected;
    default:
      return value >= expected;
  }
}

function evaluateSingleCondition(condition: any, rankedGroups: RankedGroup[]) {
  if (!condition || typeof condition !== "object") return false;

  if (condition.rank) {
    const index = Number(condition.rank) - 1;
    const ranked = rankedGroups[index];
    if (!ranked) return false;

    const expectedGroup = condition.group || condition.groupSlug;
    if (expectedGroup && ranked.slug !== expectedGroup && ranked.groupId !== expectedGroup) {
      return false;
    }

    if (condition.value === undefined) return true;
    return compare(
      ranked.percentage,
      condition.operator || ">=",
      Number(condition.value),
    );
  }

  const groupKey = condition.group || condition.groupSlug || condition.groupId;
  const group = rankedGroups.find(
    (item) => item.slug === groupKey || item.groupId === groupKey,
  );
  if (!group) return false;

  return compare(
    group.percentage,
    condition.operator || ">=",
    Number(condition.value ?? 0),
  );
}

export function evaluateRecommendationRules(
  rules: Rule[],
  rankedGroups: RankedGroup[],
) {
  return rules
    .filter((rule) => {
      const conditions = rule.conditions;

      if (Array.isArray(conditions?.all)) {
        return conditions.all.every((condition: any) =>
          evaluateSingleCondition(condition, rankedGroups),
        );
      }

      if (Array.isArray(conditions?.any)) {
        return conditions.any.some((condition: any) =>
          evaluateSingleCondition(condition, rankedGroups),
        );
      }

      return evaluateSingleCondition(conditions, rankedGroups);
    })
    .sort((left, right) => left.priority - right.priority)
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      description: rule.description,
      priority: rule.priority,
      recommendedTestId: rule.recommendedTestId,
    }));
}
