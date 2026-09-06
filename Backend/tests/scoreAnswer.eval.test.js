require("dotenv").config()
const { scoreAnswer } = require("../src/services/ai.service")
const { isQuotaOrRateLimitError } = require("../src/utils/errors")
const dataset = require("./data/answerEvalDataset")

// each real call hits the Gemini API, so give plenty of headroom over Jest's 5s default
jest.setTimeout(30000)

const TOLERANCE = 1 // a dimension "matches" the human score if within +/-1 point

const results = []
let quotaExhausted = false

describe("scoreAnswer eval suite", () => {
  test.each(dataset)("case $id: scores within tolerance of human judgment", async (sample) => {
    if (quotaExhausted) {
      console.warn(`case ${sample.id}: skipped - Gemini quota already exhausted earlier in this run.`)
      results.push({ id: sample.id, status: "skipped" })
      return
    }

    let modelScore
    try {
      modelScore = await scoreAnswer({
        question: sample.question,
        candidateAnswer: sample.candidateAnswer
      })
    } catch (err) {
      if (isQuotaOrRateLimitError(err)) {
        quotaExhausted = true
        console.warn(
          `case ${sample.id}: skipped - Gemini API quota exhausted. Remaining cases will be skipped too. Re-run this suite once the quota resets.`
        )
        results.push({ id: sample.id, status: "skipped" })
        return
      }
      throw err
    }

    const dims = ["correctness", "depth", "communication"]
    const diffs = Object.fromEntries(
      dims.map((dim) => [dim, Math.abs(modelScore[dim] - sample.humanScore[dim])])
    )
    const passed = dims.every((dim) => diffs[dim] <= TOLERANCE)

    results.push({ id: sample.id, status: passed ? "passed" : "failed", modelScore, humanScore: sample.humanScore, diffs })

    dims.forEach((dim) => {
      expect(diffs[dim]).toBeLessThanOrEqual(TOLERANCE)
    })
  })

  afterAll(() => {
    const sorted = [...results].sort((a, b) => a.id - b.id)
    const passCount = sorted.filter((r) => r.status === "passed").length
    const failCount = sorted.filter((r) => r.status === "failed").length
    const skipCount = sorted.filter((r) => r.status === "skipped").length

    console.log("\n=== scoreAnswer eval results ===")
    sorted.forEach((r) => {
      if (r.status === "skipped") {
        console.log(`case ${r.id}: SKIPPED (quota exhausted)`)
      } else {
        console.log(
          `case ${r.id}: ${r.status === "passed" ? "PASS" : "FAIL"} | model=${JSON.stringify(r.modelScore)} human=${JSON.stringify(r.humanScore)}`
        )
      }
    })

    if (skipCount > 0) {
      console.log(
        `\n${skipCount}/${dataset.length} case(s) skipped due to Gemini quota exhaustion - re-run later for a complete result.`
      )
    }
    if (passCount + failCount > 0) {
      const passRate = ((passCount / (passCount + failCount)) * 100).toFixed(1)
      console.log(`Pass rate (of cases actually run): ${passCount}/${passCount + failCount} (${passRate}%)`)
    }
  })
})
