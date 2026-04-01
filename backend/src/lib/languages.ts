import prisma from "./prisma.js";

export async function ensureBaseLanguages() {
  const defaults = [
    { code: "en", name: "English", isRtl: false },
    { code: "hi", name: "Hindi", isRtl: false },
  ];

  for (const language of defaults) {
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
}

export async function getActiveLanguages() {
  return prisma.language.findMany({
    where: { isActive: true },
    orderBy: [{ code: "asc" }],
  });
}

export async function getEnglishLanguage() {
  await ensureBaseLanguages();

  return prisma.language.findUnique({
    where: { code: "en" },
  });
}

export function resolveTranslatedText<
  T extends {
    text: string;
    translations?: Array<{
      text: string;
      language?: { code?: string | null } | null;
    }>;
  },
>(entity: T, languageCode?: string | null) {
  if (!languageCode || languageCode === "en") {
    return entity.text;
  }

  const translation = entity.translations?.find(
    (item) => item.language?.code === languageCode,
  );

  return translation?.text?.trim() ? translation.text : entity.text;
}
