// CURRENT FLOW: generateInterviewReportController is the only entry point that hits the LLM.
// Request -> parse uploaded resume PDF to text -> generateInterviewReport() (ai.service.js,
// single Gemini call) -> save whole result onto InterviewReportModel. No adaptive turns yet:
// this produces a static report (predicted questions + model answers + prep plan), not a
// live interview with scored candidate responses.
const pdfParse = require("pdf-parse")
const {generateInterviewReport, generateResumePDF, scoreAnswer, generatePerformanceReport}= require("../services/ai.service")
const {decideNextAction} = require("../services/interviewer.service")
const interviewReportModel = require ("../models/interviewReport.model")
const { isQuotaOrRateLimitError } = require("../utils/errors")

/**
 * @description controller to generate new interview report ont the basis of description,
 *  resume pdf and job description
 */
async function generateInterviewReportController (req, res)  {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required" })
        }

        const {selfDescription, jobDescription} = req.body
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()

        const interviewReportByAi = await generateInterviewReport({
            resume : resumeContent.text,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user : req.user.id,
            resume : resumeContent.text,
            selfDescription : selfDescription,
            jobDescription : jobDescription,
            ...interviewReportByAi
        })

        res.status(201).json({
            message : "Interview report generated successfully",
            interviewReport
        })
    } catch (err) {
        res.status(500).json({ message : "Failed to generate interview report", error : err.message })
    }
}

/**
 * @description controller to get interview report by interviewId
 */
async function getInterviewReportByIdController (req, res) {
    const {interviewId} = req.params
    const interviewReport = await interviewReportModel.findOne({ _id : interviewId, user : req.user.id })
    if (!interviewReport) {
        return res.status(404).json({ message : "Interview report not found" })
    }
    res.status(200).json({
        message : "Interview report fetched successfully",
        interviewReport })
}

/**
 * @description controller to get all interview reports of the logged in user.
 */
async function getAllInterviewReportsController (req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message : "Interview reports fetched successfully",
        interviewReports
    })
}

/**
 * @description controller to generate resume pdf based on the resume, self description and job description
 */

async function generateResumePDFController (req, res) {
    const {interviewReportId} = req.params

    const interviewReport = await interviewReportModel.findById({ _id : interviewReportId })

    if (!interviewReport) {
        return res.status(404).json({ message : "Interview report not found" })
    }
    const{resume, selfDescription, jobDescription} = interviewReport

    const resumePDF = await generateResumePDF({resume, selfDescription, jobDescription})

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume_${interviewReportId}.pdf"`,
    })

    res.send(resumePDF)

}


/**
 * @description controller to submit a candidate's answer to a specific
 * technical or behavioral question within an interview report
 */
async function submitAnswerController (req, res) {
    const { interviewReportId, questionType, questionId } = req.params
    const { answer } = req.body

    if (!answer || !answer.trim()) {
        return res.status(400).json({ message: "Answer is required" })
    }
    if (!["technical", "behavioral"].includes(questionType)) {
        return res.status(400).json({ message: "questionType must be 'technical' or 'behavioral'" })
    }

    const arrayField = questionType === "technical" ? "technicalQuestions" : "behavioralQuestions"

    const existingReport = await interviewReportModel.findOne(
        { _id: interviewReportId, user: req.user.id, [`${arrayField}._id`]: questionId },
        { [`${arrayField}.$`]: 1 }
    )

    if (!existingReport) {
        return res.status(404).json({ message: "Interview report or question not found" })
    }

    const question = existingReport[arrayField][0].question

    let score = null
    try {
        score = await scoreAnswer({ question, candidateAnswer: answer })
    } catch (err) {
        console.log("Error scoring answer: ", err)
    }

    const interviewReport = await interviewReportModel.findOneAndUpdate(
        { _id: interviewReportId, user: req.user.id, [`${arrayField}._id`]: questionId },
        {
            $set: {
                [`${arrayField}.$.candidateAnswer`]: answer,
                ...(score ? { [`${arrayField}.$.score`]: score } : {})
            }
        },
        { new: true }
    )

    res.status(200).json({
        message: score ? "Answer submitted and scored successfully" : "Answer submitted, but scoring failed",
        interviewReport
    })
}

/**
 * @description helper to build the ordered pool of planned topics (technical then
 * behavioral) that the live interview loop walks through
 */
function getPlannedTopics (report) {
    return [
        ...report.technicalQuestions.map(q => ({ question: q.question, type: "technical" })),
        ...report.behavioralQuestions.map(q => ({ question: q.question, type: "behavioral" }))
    ]
}

/**
 * @description controller to start a live adaptive interview for a given report.
 * Initializes interviewLoop state and sets the current question to the first planned topic.
 */
async function startLiveInterviewController (req, res) {
    const { interviewReportId } = req.params

    const report = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })
    if (!report) {
        return res.status(404).json({ message: "Interview report not found" })
    }

    const plannedTopics = getPlannedTopics(report)
    if (plannedTopics.length === 0) {
        return res.status(400).json({ message: "No questions available to start an interview" })
    }

    report.interviewLoop = {
        status: "in_progress",
        topicsCovered: [],
        followUpDepth: 0,
        questionCount: 1,
        transcript: [],
        currentQuestion: {
            question: plannedTopics[0].question,
            type: plannedTopics[0].type,
            isFollowUp: false
        }
    }
    await report.save()

    res.status(200).json({
        message: "Interview started",
        interviewLoop: report.interviewLoop
    })
}

/**
 * @description controller to submit an answer during a live adaptive interview. Scores the
 * answer, decides the next action (follow up / next topic / end), updates loop state in
 * Mongo, and returns the next question (or completion status) to the frontend.
 */
async function submitLiveAnswerController (req, res) {
    const { interviewReportId } = req.params
    const { answer } = req.body

    if (!answer || !answer.trim()) {
        return res.status(400).json({ message: "Answer is required" })
    }

    const report = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })
    if (!report || !report.interviewLoop || report.interviewLoop.status !== "in_progress") {
        return res.status(400).json({ message: "No active interview in progress" })
    }

    const { currentQuestion, topicsCovered, followUpDepth, questionCount } = report.interviewLoop

    let score = null
    let scoreError = null
    try {
        score = await scoreAnswer({ question: currentQuestion.question, candidateAnswer: answer })
    } catch (err) {
        console.log("Error scoring live answer: ", err)
        scoreError = isQuotaOrRateLimitError(err)
            ? "Your answer was saved, but couldn't be scored right now - the AI service has hit its rate limit."
            : "Your answer was saved, but couldn't be scored right now."
    }

    const updatedTopicsCovered = currentQuestion.isFollowUp
        ? topicsCovered
        : [...topicsCovered, currentQuestion.question]

    const plannedTopics = getPlannedTopics(report)
    const remainingTopics = plannedTopics
        .map(t => t.question)
        .filter(q => !updatedTopicsCovered.includes(q))

    const scoreForDecision = score || { correctness: 1, depth: 1, communication: 1, confidence: 1 }

    let decision
    try {
        decision = await decideNextAction({
            state: {
                followUpDepth: currentQuestion.isFollowUp ? followUpDepth + 1 : 0,
                questionCount
            },
            lastQuestion: currentQuestion.question,
            lastAnswer: answer,
            lastScore: scoreForDecision,
            remainingTopics
        })
    } catch (err) {
        console.log("Error deciding next interview action: ", err)
        // don't fall back to ending the interview on a transient/quota failure - that would
        // silently cut the interview short. Bail out here, before any state is mutated or
        // saved, so the candidate's current question is untouched and they can just retry.
        if (isQuotaOrRateLimitError(err)) {
            return res.status(503).json({
                message: "The AI interviewer is temporarily unavailable (rate limit reached). Please wait a moment and try submitting your answer again.",
                quotaExceeded: true
            })
        }
        decision = { action: "end" }
    }

    report.interviewLoop.topicsCovered = updatedTopicsCovered
    report.interviewLoop.transcript.push({
        question: currentQuestion.question,
        type: currentQuestion.type,
        isFollowUp: currentQuestion.isFollowUp,
        candidateAnswer: answer,
        score: score || undefined
    })
    report.interviewLoop.currentQuestion = undefined

    let performanceReportError = null
    if (decision.action === "end") {
        report.interviewLoop.status = "completed"
        report.interviewLoop.pendingNext = undefined
        try {
            report.interviewLoop.performanceReport = await generatePerformanceReport({
                transcript: report.interviewLoop.transcript
            })
        } catch (err) {
            console.log("Error generating performance report: ", err)
            performanceReportError = isQuotaOrRateLimitError(err)
                ? "Performance report unavailable - the AI service has hit its rate limit."
                : "Performance report could not be generated."
        }
    } else if (decision.action === "followUp") {
        report.interviewLoop.pendingNext = {
            action: "followUp",
            question: decision.question,
            type: currentQuestion.type,
            followUpDepth: currentQuestion.isFollowUp ? followUpDepth + 1 : 1,
            questionCount: questionCount + 1
        }
    } else {
        // nextTopic
        const nextType = plannedTopics.find(t => t.question === decision.question)?.type || currentQuestion.type
        report.interviewLoop.pendingNext = {
            action: "nextTopic",
            question: decision.question,
            type: nextType,
            followUpDepth: 0,
            questionCount: questionCount + 1
        }
    }

    await report.save()

    res.status(200).json({
        message: "Answer processed",
        score,
        interviewLoop: report.interviewLoop,
        ...(scoreError ? { scoreError } : {}),
        ...(performanceReportError ? { performanceReportError } : {})
    })
}

/**
 * @description controller to confirm the AI's proposed next step (from pendingNext) and
 * advance the live interview. If the pending step is a follow-up, the candidate may pass
 * skipFollowUp to instead jump straight to the next planned topic.
 */
async function advanceLiveInterviewController (req, res) {
    const { interviewReportId } = req.params
    const { skipFollowUp } = req.body

    const report = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })
    if (!report || !report.interviewLoop || report.interviewLoop.status !== "in_progress" || !report.interviewLoop.pendingNext) {
        return res.status(400).json({ message: "No pending next question" })
    }

    let { pendingNext } = report.interviewLoop

    if (skipFollowUp && pendingNext.action === "followUp") {
        const plannedTopics = getPlannedTopics(report)
        const remainingTopics = plannedTopics
            .map(t => t.question)
            .filter(q => !report.interviewLoop.topicsCovered.includes(q))
        const nextTopic = remainingTopics[0]

        if (!nextTopic) {
            report.interviewLoop.status = "completed"
            report.interviewLoop.currentQuestion = undefined
            report.interviewLoop.pendingNext = undefined
            let performanceReportError = null
            if (report.interviewLoop.transcript.length > 0) {
                try {
                    report.interviewLoop.performanceReport = await generatePerformanceReport({
                        transcript: report.interviewLoop.transcript
                    })
                } catch (err) {
                    console.log("Error generating performance report: ", err)
                    performanceReportError = isQuotaOrRateLimitError(err)
                        ? "Performance report unavailable - the AI service has hit its rate limit."
                        : "Performance report could not be generated."
                }
            }
            await report.save()
            return res.status(200).json({
                message: "Interview ended",
                interviewLoop: report.interviewLoop,
                ...(performanceReportError ? { performanceReportError } : {})
            })
        }

        pendingNext = {
            action: "nextTopic",
            question: nextTopic,
            type: plannedTopics.find(t => t.question === nextTopic)?.type,
            followUpDepth: 0,
            questionCount: pendingNext.questionCount
        }
    }

    report.interviewLoop.followUpDepth = pendingNext.followUpDepth
    report.interviewLoop.questionCount = pendingNext.questionCount
    report.interviewLoop.currentQuestion = {
        question: pendingNext.question,
        type: pendingNext.type,
        isFollowUp: pendingNext.action === "followUp"
    }
    report.interviewLoop.pendingNext = undefined

    await report.save()

    res.status(200).json({
        message: "Advanced to next question",
        interviewLoop: report.interviewLoop
    })
}

/**
 * @description controller to manually end a live interview at any point while it is in
 * progress. Generates a performance report from whatever transcript exists so far.
 */
async function endLiveInterviewController (req, res) {
    const { interviewReportId } = req.params

    const report = await interviewReportModel.findOne({ _id: interviewReportId, user: req.user.id })
    if (!report || !report.interviewLoop || report.interviewLoop.status !== "in_progress") {
        return res.status(400).json({ message: "No active interview in progress" })
    }

    report.interviewLoop.status = "completed"
    report.interviewLoop.currentQuestion = undefined
    report.interviewLoop.pendingNext = undefined

    let performanceReportError = null
    if (report.interviewLoop.transcript.length > 0) {
        try {
            report.interviewLoop.performanceReport = await generatePerformanceReport({
                transcript: report.interviewLoop.transcript
            })
        } catch (err) {
            console.log("Error generating performance report: ", err)
            performanceReportError = isQuotaOrRateLimitError(err)
                ? "Performance report unavailable - the AI service has hit its rate limit."
                : "Performance report could not be generated."
        }
    }

    await report.save()

    res.status(200).json({
        message: "Interview ended",
        interviewLoop: report.interviewLoop,
        ...(performanceReportError ? { performanceReportError } : {})
    })
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePDFController,
    submitAnswerController,
    startLiveInterviewController,
    submitLiveAnswerController,
    advanceLiveInterviewController,
    endLiveInterviewController
}