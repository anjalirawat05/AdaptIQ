import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
})

/**
 * @description service to generate interview report by sending resume, selfDescription and jobDescription to backend
 */

export const generateInterviewReport = async ({ resumeFile, selfDescription, jobDescription }) => {
    const formData = new FormData(); // to send file from frontend to backend
    formData.append("resume", resumeFile)
    formData.append("selfDescription", selfDescription)
    formData.append("jobDescription", jobDescription)

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
    return response.data
}

/**
 * @description service to get interview report by ID
 */

export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)
    return response.data
}

/**
 * @description service to get all interview reports of the logged in user
 */

export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")
    return response.data
}

/**
 * @description service to submit a candidate's answer to a specific question
 */

export const submitAnswer = async ({ interviewReportId, questionType, questionId, answer }) => {
    const response = await api.post(
        `/api/interview/${interviewReportId}/${questionType}/${questionId}/answer`,
        { answer }
    )
    return response.data
}

/**
 * @description service to start a live adaptive interview for a report
 */

export const startLiveInterview = async (interviewReportId) => {
    const response = await api.post(`/api/interview/${interviewReportId}/live/start`)
    return response.data
}

/**
 * @description service to submit an answer during a live adaptive interview
 */

export const submitLiveAnswer = async ({ interviewReportId, answer }) => {
    const response = await api.post(`/api/interview/${interviewReportId}/live/answer`, { answer })
    return response.data
}

/**
 * @description service to confirm (or override with skipFollowUp) the AI's proposed next question
 */

export const advanceLiveInterview = async ({ interviewReportId, skipFollowUp }) => {
    const response = await api.post(`/api/interview/${interviewReportId}/live/next`, { skipFollowUp })
    return response.data
}

/**
 * @description service to manually end a live interview in progress
 */

export const endLiveInterview = async (interviewReportId) => {
    const response = await api.post(`/api/interview/${interviewReportId}/live/end`)
    return response.data
}

/**
 * @description service to generate resume pdf based on the resume, self description and job description
 */

export const generateResumePDF = async (interviewReportId) => {
    const response = await api.get(`/api/interview/resume/pdf/${interviewReportId}`, {
        responseType: 'blob', // to handle binary data (PDF)
    })

    return response.data

}