# AdaptIQ

An AI interview prep tool that goes past "here are 10 questions to practice." It generates questions from your resume and a job description, then actually interviews you — asking follow-ups when your answer is thin, scoring what you actually said, and giving you a real wrap-up report at the end instead of generic feedback.

## How it works

1. Upload your resume + a job description → get a tailored set of questions and a prep plan.
2. Take the live interview: answer, get scored, get a follow-up or the next question depending on how you did. You can skip a follow-up or end anytime.
3. Get a performance report at the end — strengths, weaknesses, verdict — grounded in your actual transcript.

Scoring is rubric-based (every score needs a real quote from your answer as evidence), deterministic (temperature 0), and flags low-confidence scores for review instead of pretending to be sure.

## Running it

**Backend**
```
cd Backend
npm install
npm run dev
```
Needs a `.env` with `MONGO_URI`, `JWT_SECRET`, and `GOOGLE_GENAI_API_KEY`.

**Frontend**
```
cd Frontend
npm install
npm run dev
```

## Eval

```
cd Backend
npm test
```

