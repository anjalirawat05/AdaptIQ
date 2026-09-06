const { GoogleGenAI } = require("@google/genai")
const z = require("zod")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const MAX_FOLLOW_UP_DEPTH = 2
const MAX_QUESTIONS = 10

const decisionSchema = z.object({
    action: z.enum(["followUp", "nextTopic", "end"]).describe("what to do next in the interview"),
    question: z.string().optional().describe("the next question to ask the candidate; omit or leave empty if action is 'end'")
}).describe("decision for what the interviewer should do next")

/**
 * @description decides the next step in a live interview based on the candidate's last
 * answer and its rubric score. Hard caps (follow-up depth, total questions) are enforced
 * in code both before and after the LLM call, so the model's output can never exceed them.
 */
async function decideNextAction({ state, lastQuestion, lastAnswer, lastScore, remainingTopics }, attempt = 1) {
    if (state.questionCount >= MAX_QUESTIONS) {
        return { action: "end" }
    }

    const canFollowUp = state.followUpDepth < MAX_FOLLOW_UP_DEPTH
    const nextPlannedTopic = remainingTopics[0]

    if (!canFollowUp && !nextPlannedTopic) {
        return { action: "end" }
    }

    const prompt = `
You are conducting a live technical/behavioral interview. Decide the next action based on
the candidate's last answer and its rubric score.

Last question: ${lastQuestion}
Candidate's answer: ${lastAnswer}
Score: correctness=${lastScore.correctness}, depth=${lastScore.depth}, communication=${lastScore.communication}, confidence=${lastScore.confidence}

${canFollowUp
    ? `You MAY ask a follow-up question that probes deeper into the same topic if the answer was shallow, vague, or left something unexplored (action: "followUp").`
    : `The follow-up limit for this topic has been reached - you may NOT choose "followUp".`}

${nextPlannedTopic
    ? `If you don't need a follow-up, move to the next planned topic by choosing action "nextTopic" and using this exact question text: "${nextPlannedTopic}"`
    : `There are no more planned topics left - if you don't ask a follow-up, choose action: "end".`}

Only choose "followUp" if it would genuinely reveal something the answer didn't already
cover. Do not ask a follow-up just because you are allowed to.
`

    let parsed
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: z.toJSONSchema(decisionSchema)
            }
        })
        parsed = decisionSchema.parse(JSON.parse(response.text))
    } catch (err) {
        if (attempt >= 2) throw err
        return decideNextAction({ state, lastQuestion, lastAnswer, lastScore, remainingTopics }, attempt + 1)
    }

    // re-enforce hard caps in code regardless of what the model returned
    if (parsed.action === "followUp" && !canFollowUp) {
        return nextPlannedTopic ? { action: "nextTopic", question: nextPlannedTopic } : { action: "end" }
    }
    if (parsed.action === "nextTopic" && !nextPlannedTopic) {
        return { action: "end" }
    }
    if (parsed.action !== "end" && !parsed.question) {
        return { action: "end" }
    }
    // the model may not end the interview early just because it feels like it - "end" is
    // only honored once there is truly nothing left to ask (no planned topics, no follow-up
    // budget) or the question cap was hit above. Otherwise, force it to keep going.
    if (parsed.action === "end" && (nextPlannedTopic || canFollowUp)) {
        return nextPlannedTopic ? { action: "nextTopic", question: nextPlannedTopic } : { action: "end" }
    }

    return parsed
}

module.exports = { decideNextAction, MAX_FOLLOW_UP_DEPTH, MAX_QUESTIONS }
