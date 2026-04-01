# Multilingual Test Process

## What is implemented

- Tests can now be configured with allowed languages.
- English is the base source language for every test.
- Questions and options can store reviewed translations per selected test language.
- Student attempts now store `selectedLanguage`.
- Student APIs can start an attempt with a chosen language.
- Student APIs can switch the attempt language while the exam is in progress.
- Question payloads now resolve translated text with English fallback.

## Recommended student flow

1. Load test details and show available languages before starting the exam.
2. Require the student to choose a language before calling `POST /api/student/attempts/:testId/start`.
3. Send `{ "languageCode": "hi" }` or another allowed code while starting.
4. When the exam screen opens, read `selectedLanguage` and `availableLanguages` from `GET /api/student/attempts/:attemptId/questions`.
5. If the student switches language during the exam, call `PATCH /api/student/attempts/:attemptId/language` with the new `languageCode`.
6. Re-fetch questions after the switch and keep saved answers unchanged.

## Production rules

- Never use Google Translate for exam questions or answer options.
- Keep English as the editorial source of truth.
- Only publish manually reviewed translations.
- Fall back to English when a translation is missing.
- Lock language availability at the test level.
- Persist the chosen language per attempt for auditability.
- Make sure switching language never changes selected answers, timers, order, or scoring.

## APIs

- `GET /api/admin/languages`
- `POST /api/admin/tests`
- `PUT /api/admin/tests/:id`
- `GET /api/admin/tests/:id`
- `POST /api/admin/questions`
- `PUT /api/admin/questions/:id`
- `POST /api/student/attempts/:testId/start`
- `GET /api/student/attempts/:attemptId/questions`
- `PATCH /api/student/attempts/:attemptId/language`
