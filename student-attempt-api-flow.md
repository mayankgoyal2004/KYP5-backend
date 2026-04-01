# Student Test Attempt API Flow

This file documents the full student exam flow from loading tests to submitting an attempt.

## Auth

- All endpoints below require student authentication.
- Send the student token/cookie the same way as the existing student dashboard APIs.
- Standard response envelope:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": {}
}
```

## 1. Get Available Tests

Use this for the test list page.

- Method: `GET`
- URL: `/api/student/tests?page=1&limit=10&search=&courseId=`

### Example response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": {
    "data": [
      {
        "id": "test_123",
        "title": "Demo Test",
        "courseId": "course_123",
        "duration": 30,
        "totalQuestions": 20,
        "allowedAttempts": 2,
        "negativeMarking": true,
        "negativeMarkValue": 0.25,
        "showResult": true,
        "course": {
          "id": "course_123",
          "title": "Demo Course",
          "thumbnail": "/uploads/course.png"
        },
        "testLanguages": [
          {
            "id": "test_language_1",
            "languageId": "lang_en",
            "testId": "test_123",
            "language": {
              "id": "lang_en",
              "code": "en",
              "name": "English",
              "isRtl": false
            }
          },
          {
            "id": "test_language_2",
            "languageId": "lang_hi",
            "testId": "test_123",
            "language": {
              "id": "lang_hi",
              "code": "hi",
              "name": "Hindi",
              "isRtl": false
            }
          }
        ],
        "availableLanguages": [
          {
            "id": "lang_en",
            "code": "en",
            "name": "English",
            "isRtl": false
          },
          {
            "id": "lang_hi",
            "code": "hi",
            "name": "Hindi",
            "isRtl": false
          }
        ],
        "_count": {
          "questions": 20
        },
        "studentStatus": {
          "attemptCount": 0,
          "isCompleted": false,
          "inProgressId": null,
          "canAttempt": true
        }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### Frontend usage

- Show the test list.
- Read `availableLanguages` and let the student choose one before starting.
- If `studentStatus.inProgressId` exists, the student can resume instead of creating a new attempt.
- If `studentStatus.canAttempt` is `false`, disable the start button.

## 2. Get Single Test Detail

Use this on the test instruction page before starting.

- Method: `GET`
- URL: `/api/student/tests/:testId`

### Example response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": {
    "test": {
      "id": "test_123",
      "title": "Demo Test",
      "duration": 30,
      "totalQuestions": 20,
      "allowedAttempts": 2,
      "instructions": "Read all questions carefully.",
      "termsConditions": "Do not switch tabs repeatedly.",
      "negativeMarking": true,
      "negativeMarkValue": 0.25,
      "shuffleQuestions": true,
      "showResult": true,
      "showAnswers": false,
      "course": {
        "title": "Demo Course",
        "description": "Course description"
      },
      "_count": {
        "questions": 20
      },
      "availableLanguages": [
        {
          "id": "lang_en",
          "code": "en",
          "name": "English",
          "isRtl": false
        },
        {
          "id": "lang_hi",
          "code": "hi",
          "name": "Hindi",
          "isRtl": false
        }
      ]
    },
    "studentStatus": {
      "attemptCount": 0,
      "isCompleted": false,
      "inProgressId": null,
      "canAttempt": true,
      "attempts": []
    }
  }
}
```

### Frontend usage

- Show instructions and terms.
- Make language selection mandatory from `test.availableLanguages`.
- Store selected language code like `en` or `hi`.

## 3. Start Attempt

- Method: `POST`
- URL: `/api/student/attempts/:testId/start`

### Required payload

```json
{
  "languageCode": "hi"
}
```

### Notes

- `languageCode` should come from `availableLanguages`.
- If omitted, backend defaults to `"en"`.
- If the student already has an active attempt, this API returns that same attempt instead of creating a new one.

### Example response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Attempt started",
  "data": {
    "id": "attempt_123",
    "userId": "student_123",
    "testId": "test_123",
    "attemptNumber": 1,
    "status": "IN_PROGRESS",
    "startTime": "2026-03-31T10:00:00.000Z",
    "expiresAt": "2026-03-31T10:30:00.000Z",
    "selectedLanguage": "hi",
    "browserWarnings": 0,
    "isTabSwitched": false
  }
}
```

### What to store on frontend

- `attemptId` from `data.id`
- `selectedLanguage` from `data.selectedLanguage`
- `expiresAt` from `data.expiresAt`

## 4. Load Questions for Attempt

- Method: `GET`
- URL: `/api/student/attempts/:attemptId/questions`

### Example response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Success",
  "data": {
    "test": {
      "id": "test_123",
      "title": "Demo Test",
      "duration": 30,
      "totalQuestions": 20,
      "negativeMarking": true,
      "expiresAt": "2026-03-31T10:30:00.000Z",
      "minAnswersRequired": 1,
      "shuffleQuestions": true,
      "selectedLanguage": "hi",
      "availableLanguages": [
        {
          "id": "lang_en",
          "code": "en",
          "name": "English",
          "isRtl": false
        },
        {
          "id": "lang_hi",
          "code": "hi",
          "name": "Hindi",
          "isRtl": false
        }
      ]
    },
    "questions": [
      {
        "id": "question_1",
        "testId": "test_123",
        "text": "2+2 कितना है?",
        "type": "MCQ",
        "difficulty": "MEDIUM",
        "marks": 1,
        "negativeMarks": 0,
        "order": 1,
        "imageUrl": null,
        "options": [
          {
            "id": "option_1",
            "text": "3",
            "order": 1,
            "imageUrl": null
          },
          {
            "id": "option_2",
            "text": "4",
            "order": 2,
            "imageUrl": null
          }
        ]
      }
    ],
    "userAnswers": []
  }
}
```

### Frontend usage

- Render the exam screen from `data.questions`.
- Use `data.test.selectedLanguage` to set the active language selector.
- Use `data.test.availableLanguages` to render the switch-language dropdown.
- Use `data.userAnswers` to restore already-saved answers when resuming.

## 5. Save Answer

Call this on every answer change, next-question click, or periodic autosave.

- Method: `POST`
- URL: `/api/student/attempts/:attemptId/save`

### Required payload

```json
{
  "questionId": "question_1",
  "selectedOptionId": "option_2",
  "isMarkedForReview": false,
  "timeTakenSeconds": 18
}
```

### Payload rules

- `questionId` is required.
- `selectedOptionId` can be `null` to clear the answer.
- `isMarkedForReview` is optional but recommended.
- `timeTakenSeconds` is the incremental time spent since the last save for that question.

### Example clear-answer payload

```json
{
  "questionId": "question_1",
  "selectedOptionId": null,
  "isMarkedForReview": true,
  "timeTakenSeconds": 5
}
```

### Example response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Answer saved",
  "data": {
    "id": "user_answer_1",
    "attemptId": "attempt_123",
    "questionId": "question_1",
    "selectedOptionId": "option_2",
    "isMarkedForReview": false,
    "isAnswered": true,
    "timeTakenSeconds": 18
  }
}
```

## 6. Switch Language During Attempt

This step is optional.

- Method: `PATCH`
- URL: `/api/student/attempts/:attemptId/language`

### Required payload

```json
{
  "languageCode": "en"
}
```

### Example response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Attempt language updated successfully",
  "data": {
    "id": "attempt_123",
    "selectedLanguage": "en"
  }
}
```

### Required frontend step after switch

- Call `GET /api/student/attempts/:attemptId/questions` again.
- Do not clear local answers.
- Replace only translated question and option text on screen.

## 7. Report Browser Warning

This step is optional.

- Method: `POST`
- URL: `/api/student/attempts/:attemptId/browser-warning`
- Payload: no body required

### Example response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Warning recorded",
  "data": null
}
```

## 8. Submit Attempt

- Method: `POST`
- URL: `/api/student/attempts/:attemptId/submit`
- Payload: no body required

### Example success response when results are enabled

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Exam submitted successfully",
  "data": {
    "score": 18,
    "totalMarks": 20,
    "percentage": 90,
    "isPassed": true,
    "correctCount": 18,
    "wrongCount": 2,
    "skippedCount": 0
  }
}
```

### Example success response when results are hidden

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Exam submitted successfully",
  "data": null
}
```

## 9. Fetch Result After Submission

This step is optional and depends on exam settings.

### Get student result list

- Method: `GET`
- URL: `/api/student/results?page=1&limit=10`

### Get one result

- Method: `GET`
- URL: `/api/student/results/:attemptId`

### Notes

- If `showResult` is `false`, the API returns a message saying results are hidden.
- If `showAnswers` is `false`, the result summary is returned without detailed answers.

## Minimum Frontend Flow

1. Call `GET /api/student/tests` or `GET /api/student/tests/:testId`.
2. Read `availableLanguages`.
3. Let student select language.
4. Call `POST /api/student/attempts/:testId/start` with `{ "languageCode": "..." }`.
5. Save returned `attemptId`.
6. Call `GET /api/student/attempts/:attemptId/questions`.
7. Call `POST /api/student/attempts/:attemptId/save` during the exam.
8. Optionally call `PATCH /api/student/attempts/:attemptId/language`.
9. Optionally call `POST /api/student/attempts/:attemptId/browser-warning`.
10. Call `POST /api/student/attempts/:attemptId/submit`.
11. Optionally call `GET /api/student/results/:attemptId`.

## Common Error Cases

- Start attempt with unsupported language:
  - Message: `Selected language is not available for this test`
- Start attempt before test window:
  - Message: `Test has not started yet`
- Start attempt after expiry:
  - Message: `Test has expired`
- Start attempt after max attempts reached:
  - Message: `Maximum attempts (X) reached`
- Load questions after timer expiry:
  - Message: `Test time has expired. Your answers have been submitted.`
- Save or switch language after attempt is inactive:
  - Message: `Attempt is no longer active`
- Submit again after already submitted:
  - Message: `Already submitted`

## Recommended Frontend State

- `testId`
- `attemptId`
- `selectedLanguage`
- `availableLanguages`
- `expiresAt`
- `questions`
- `userAnswers`
- `studentStatus`

