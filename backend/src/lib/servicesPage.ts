const DEFAULT_WORK_PROCESS_STEPS = [
  {
    title: "Discovery",
    description: "We understand your goals, constraints, and success criteria.",
  },
  {
    title: "Execution",
    description: "We build, refine, and align the service delivery with your needs.",
  },
  {
    title: "Delivery",
    description: "We hand over the final outcome with clear support and follow-through.",
  },
];

const DEFAULT_BENEFIT_CARDS = [
  {
    icon: "BadgeCheck",
    iconPackage: "@fortawesome/free-solid-svg-icons",
    title: "Trusted Quality",
    description: "Reliable delivery standards that keep work clear and consistent.",
  },
  {
    icon: "Zap",
    iconPackage: "@fortawesome/free-solid-svg-icons",
    title: "Fast Turnaround",
    description: "Lean execution that helps your team move from plan to outcome faster.",
  },
  {
    icon: "Users",
    iconPackage: "@fortawesome/free-solid-svg-icons",
    title: "Dedicated Support",
    description: "A collaborative process with direct communication at each stage.",
  },
];

export const DEFAULT_SERVICES_PAGE = {
  title: "Our Services",
  price: "",
  briefIntro:
    "Introduce your services clearly so visitors understand what you offer and why it matters.",
  aboutTitle: "About This Service",
  aboutDescription:
    "Use this section to explain the service, who it helps, and the outcomes clients can expect.",
  aboutImage: "",
  aboutStatus: true,
  workProcessTitle: "Work Process",
  workProcessSubTitle: "",
  workProcessStepsCount: DEFAULT_WORK_PROCESS_STEPS.length,
  workProcessSteps: DEFAULT_WORK_PROCESS_STEPS,
  benefitsMainTitle: "Benefits",
  benefitsSubTitle: "",
  benefitsCards: DEFAULT_BENEFIT_CARDS,
  order: 0,
  isActive: true,
};

function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}

export function normalizeWorkProcessSteps(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_WORK_PROCESS_STEPS;
  }

  const steps = value
    .map((item) => ({
      title: normalizeText(item?.title).trim(),
      description: normalizeText(item?.description).trim(),
    }))
    .filter((item) => item.title || item.description);

  return steps.length > 0 ? steps : DEFAULT_WORK_PROCESS_STEPS;
}

export function normalizeBenefitsCards(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_BENEFIT_CARDS;
  }

  const cards = value
    .slice(0, 3)
    .map((item) => ({
      icon: normalizeText(item?.icon).trim(),
      iconPackage: normalizeText(item?.iconPackage).trim(),
      title: normalizeText(item?.title).trim(),
      description: normalizeText(item?.description).trim(),
    }));

  while (cards.length < 3) {
    cards.push(DEFAULT_BENEFIT_CARDS[cards.length]);
  }

  return cards;
}

export function normalizeServiceRecord(record?: Record<string, unknown>) {
  const workProcessSteps = normalizeWorkProcessSteps(record?.workProcessSteps);
  const workProcessStepsCount = normalizeInteger(
    record?.workProcessStepsCount,
    workProcessSteps.length,
  );

  return {
    title: normalizeText(record?.title, DEFAULT_SERVICES_PAGE.title),
    price: normalizeText(record?.price, DEFAULT_SERVICES_PAGE.price),
    briefIntro: normalizeText(
      record?.briefIntro,
      DEFAULT_SERVICES_PAGE.briefIntro,
    ),
    aboutTitle: normalizeText(
      record?.aboutTitle,
      DEFAULT_SERVICES_PAGE.aboutTitle,
    ),
    aboutDescription: normalizeText(
      record?.aboutDescription,
      DEFAULT_SERVICES_PAGE.aboutDescription,
    ),
    aboutImage: normalizeText(
      record?.aboutImage,
      DEFAULT_SERVICES_PAGE.aboutImage,
    ),
    aboutStatus: normalizeBoolean(
      record?.aboutStatus,
      DEFAULT_SERVICES_PAGE.aboutStatus,
    ),
    workProcessTitle: normalizeText(
      record?.workProcessTitle,
      DEFAULT_SERVICES_PAGE.workProcessTitle,
    ),
    workProcessSubTitle: normalizeText(
      record?.workProcessSubTitle,
      DEFAULT_SERVICES_PAGE.workProcessSubTitle,
    ),
    workProcessStepsCount,
    workProcessSteps: workProcessSteps.slice(0, workProcessStepsCount || 0),
    benefitsMainTitle: normalizeText(
      record?.benefitsMainTitle,
      DEFAULT_SERVICES_PAGE.benefitsMainTitle,
    ),
    benefitsSubTitle: normalizeText(
      record?.benefitsSubTitle,
      DEFAULT_SERVICES_PAGE.benefitsSubTitle,
    ),
    benefitsCards: normalizeBenefitsCards(record?.benefitsCards),
    order: normalizeInteger(record?.order, DEFAULT_SERVICES_PAGE.order),
    isActive: normalizeBoolean(
      record?.isActive,
      DEFAULT_SERVICES_PAGE.isActive,
    ),
  };
}

export const normalizeServicesPageRecord = normalizeServiceRecord;
