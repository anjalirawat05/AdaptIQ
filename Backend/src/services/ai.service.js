// CURRENT FLOW (as of this comment): this file is a one-shot REPORT GENERATOR, not an
// interview loop. generateInterviewReport() is the single LLM call site (see below) — it
// takes resume + selfDescription + jobDescription and returns predicted questions, model
// "how to answer" text, skill gaps, and a prep plan, in one shot with JSON-mode responseSchema.
// There is no candidate-answer capture, no scoring of a real answer, and no turn-by-turn
// question/answer loop yet. Phase 1 (rubric scoring) requires adding that loop first, or
// scoring against text the candidate actually submits.
const {GoogleGenAI} = require( "@google/genai")
//Zod is used to define the shape and rules of your data.
const z = require("zod")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});
//creating schema for providing to the ai
const interviewReportSchema = z.object({
    matchScore: z.number().describe("the overall score of the candidate indicating how well they match the job description").min(0, "Score must be a positive number").max(100, "Score must be less than or equal to 100"),

    technicalQuestions: z.array(z.object({
        question: z.string().describe("the technical questions that can be asked in the interview").min(1, "Question is required"),
        intention: z.string().describe("the intention of the interviewer behind asking the question").min(1, "Intention is required"),
        answer: z.string().describe("how to answer the question, what points to cover, what approach to take etc.").min(1, "Answer is required")
    })).describe("the technical questions that can be asked in the interview, their intention and how to answer them"),

     behavioralQuestions: z.array(z.object({
        question: z.string().describe("the behavioral questions that can be asked in the interview").min(1, "Question is required"),
        intention: z.string().describe("the intention of the interviewer behind asking the question").min(1, "Intention is required"),
        answer: z.string().describe("how to answer the question, what points to cover, what approach to take etc.").min(1, "Answer is required")
    })).describe("the behavioral questions that can be asked in the interview, their intention and how to answer them"),

    skillGaps: z.array(z.object({
        skill: z.string().describe("the skill that the candidate is lacking").min(1, "Skill is required"),
        importance: z.enum(["low", "medium", "high"]).describe("the importance of the skill for the job role")
    })).describe("the skills that the candidate is lacking and their importance for the job role"),

    preparationPlan: z.array(z.object({
        day: z.number().describe("the day of the preparation plan").min(1, "Day is required"),
        focus: z.string().describe("the focus of the preparation plan for the day").min(1, "Focus is required"),
        tasks: z.array(z.string()).describe("the tasks to be completed for the day").min(1, "Task is required")
    })).describe("the preparation plan for the candidate to improve their skills and prepare for the interview daywise"),
    title: z.string().describe("the title of the job for which the interview report is generated").min(1, "Title is required")
}).describe("the interview report containing technical questions, behavioral questions, skill gaps and preparation plan")        

async function generateInterviewReport({resume, selfDescription, jobDescription}) {
    const prompt = `
You are an expert career coach and interviewer. You have been asked to generate an interview report for a candidate based on their
 resume:${resume}, self-description: ${selfDescription}, and the job description: ${jobDescription}
`
    const response = await ai.models.generateContent({
        model : "gemini-3.6-flash",
        contents:prompt,
        config:{
            responseMimeType : "application/json",
            responseSchema : z.toJSONSchema(interviewReportSchema)
        }
    })

    console.log(JSON.parse(response.text))
    return JSON.parse(response.text)


}

const answerScoreSchema = z.object({
    correctness: z.number().int().min(1).max(5).describe("accuracy of the technical/factual content"),
    depth: z.number().int().min(1).max(5).describe("does it go beyond a surface-level response - reasoning, trade-offs, examples"),
    communication: z.number().int().min(1).max(5).describe("clarity and organization of the answer"),
    evidence: z.string().min(1).describe("a direct quote copied from the candidate's answer that justifies the scores above"),
    confidence: z.number().int().min(1).max(5).describe("how much substantive material the answer gave you to judge - NOT how sure you are that a low score is deserved. A short, off-topic, or evasive answer must get LOW confidence (1-2) even if the correctness score is also low, because there isn't enough content to be confident in a nuanced score. Reserve high confidence (4-5) for answers detailed enough to fully justify each dimension above")
}).describe("rubric-based score for a single candidate answer")

/**
 * @description scores a candidate's answer to an interview question against a fixed rubric.
 * Retries once on a parse failure before giving up.
 */
async function scoreAnswer({ question, candidateAnswer }, attempt = 1) {
    const prompt = `
You are grading a candidate's interview answer against a fixed rubric. Score ONLY what is
present in the answer below. Do not invent strengths or weaknesses that are not there, and
do not reward generic phrasing that doesn't actually answer the question.

Question: ${question}
Candidate's Answer: ${candidateAnswer}

Score correctness, depth, and communication from 1 to 5. "evidence" must be a direct quote
copied verbatim from the candidate's answer above - do not paraphrase or summarize it.

"confidence" (1-5) is NOT how sure you are that the answer is bad - it measures how much
substantive material the answer actually gave you to judge. A short, off-topic, evasive, or
"I don't know" style answer must get LOW confidence (1-2), even though its correctness/depth
scores are also low, because there isn't enough content to be confident in a nuanced
judgment. Only give high confidence (4-5) when the answer is detailed enough that you are
sure of every dimension above.
`
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: z.toJSONSchema(answerScoreSchema)
            }
        })
        const parsed = answerScoreSchema.parse(JSON.parse(response.text))
        return { ...parsed, needsReview: parsed.confidence <= 2 }
    } catch (err) {
        if (attempt >= 2) throw err
        return scoreAnswer({ question, candidateAnswer }, attempt + 1)
    }
}

const performanceReportSchema = z.object({
    strengths: z.array(z.string()).min(1).describe("specific strengths, each grounded in something the candidate actually said"),
    weaknesses: z.array(z.string()).describe("specific weaknesses, each grounded in something the candidate said or failed to address - do not invent issues not evidenced in the transcript"),
    verdict: z.enum(["strong_hire", "hire", "borderline", "no_hire"]).describe("overall hiring recommendation based purely on interview performance"),
    summary: z.string().min(1).describe("a short 2-4 sentence overall summary of the candidate's interview performance")
}).describe("post-interview performance report summarizing the candidate's overall performance")

/**
 * @description generates a post-interview performance report (strengths, weaknesses,
 * verdict, summary) from the full transcript of a completed live interview. Every
 * strength/weakness must be grounded in the transcript - the prompt explicitly forbids
 * inventing issues or praise that aren't evidenced there.
 */
async function generatePerformanceReport({ transcript }, attempt = 1) {
    const transcriptText = transcript.map((t, i) => `
Q${i + 1} (${t.type}${t.isFollowUp ? ", follow-up" : ""}): ${t.question}
Candidate's Answer: ${t.candidateAnswer}
Scores: correctness=${t.score?.correctness ?? "N/A"}, depth=${t.score?.depth ?? "N/A"}, communication=${t.score?.communication ?? "N/A"}
Evidence: ${t.score?.evidence ?? "N/A"}
`).join("\n")

    const prompt = `
You are summarizing a candidate's performance in a completed interview, based strictly on
the transcript below. Every strength or weakness you list must be grounded in something the
candidate actually said - do not invent issues or praise that isn't evidenced here.

${transcriptText}

Based only on the above, list concrete strengths and weaknesses, give an overall hiring
verdict, and write a short summary.
`
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: z.toJSONSchema(performanceReportSchema)
            }
        })
        return performanceReportSchema.parse(JSON.parse(response.text))
    } catch (err) {
        if (attempt >= 2) throw err
        return generatePerformanceReport({ transcript }, attempt + 1)
    }
}

async function generatePdfFromHtml(htmlContent) {
    // lazy-loaded: puppeteer is ESM-only and heavy, and only this function needs it
    const puppeteer = require("puppeteer")
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdfBuffer;
}

async function generateResumePDF({resume, selfDescription, jobDescription}) {

    const resumePDFSchema = z.object({
        html: z.string().describe("the HTML content of the resume which will be converted to PDF")
    })

const prompt = `Generate a resume in HTML format based on the following information:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

the resume should be well-structured, visually appealing, and highlight the candidate's skills, experience, and achievements relevant to the job description. The HTML should be responsive and suitable for conversion to PDF. Please provide only the HTML content without any additional text or explanations.
it should not sound like a resume generated by AI, it should be a professional resume that can be used for job applications. The HTML should be clean and well-formatted, with appropriate use of headings, lists, and other HTML elements to present the information effectively.
you can highlight the content using some colors or different font styles, but it should be professional and not too flashy. The resume should be easy to read and navigate, with clear sections for different types of information. Please ensure that the HTML is valid and can be rendered correctly in a web browser.
the content should be ats friendly, meaning it should be easily readable by applicant tracking systems (ATS) used by employers to screen resumes. Avoid using complex layouts or graphics that may not be parsed correctly by ATS software.
the resume should not be lengthy, it should be concise and to the point, focusing on the most important information that will make the candidate stand out to potential employers.
`
const response = await ai.models.generateContent({
    model : "gemini-3.6-flash",
    contents:prompt,
    config:{
        responseMimeType : "application/json",
        responseSchema : z.toJSONSchema(resumePDFSchema)
    }
})

const jsonContent = JSON.parse(response.text)

const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

return pdfBuffer
}



 module.exports = { generateInterviewReport, generateResumePDF, scoreAnswer, generatePerformanceReport }

