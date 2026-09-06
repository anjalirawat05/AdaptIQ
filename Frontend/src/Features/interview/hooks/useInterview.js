import {generateInterviewReport, getAllInterviewReports, getInterviewReportById, generateResumePDF as generateResumePDFApi, submitAnswer as submitAnswerApi, startLiveInterview as startLiveInterviewApi, submitLiveAnswer as submitLiveAnswerApi, advanceLiveInterview as advanceLiveInterviewApi, endLiveInterview as endLiveInterviewApi} from "../services/interview.api"
import {useContext, useState} from "react"
import {InterviewContext} from "../interview.context"

export const useInterview = () => {
    const context = useContext(InterviewContext)

    if(!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const {loading, setLoading, report, setReport, reports, setReports} = context

    /**
     * @description calling apis from interview.api and getting the response and now setting the
     *  generated response to the state using setReport and setReports
     */
    const generateReport = async ({resumeFile, selfDescription, jobDescription}) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({resumeFile, selfDescription, jobDescription})
            setReport(response.interviewReport)
        }
        catch (err) {
           console.log("Error generating interview report: ", err)
        }
        finally {
            setLoading(false)
        }
        return response?.interviewReport

    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try{
            response  = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        }
        catch (err) {
           console.log("Error fetching interview report: ", err)
        }
        finally {
            setLoading(false)
        }
        return response?.interviewReport
    }

    const getAllReports = async () => {
        setLoading(true)
        let response = null
        try{
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        }
        catch (err) {
           console.log("Error fetching all interview reports: ", err)
        }
        finally {
            setLoading(false)
        }
        return response?.interviewReports
    }

    const generateResumePDF = async (interviewReportId) => {
        setLoading(true)
        try{
            const response = await generateResumePDFApi(interviewReportId)
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `resume_${interviewReportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        }
        catch (err) {
           console.log("Error generating resume PDF: ", err)
        }
        finally {
            setLoading(false)
        }
    }

    const submitAnswer = async ({ questionType, questionId, answer }) => {
        try {
            const response = await submitAnswerApi({
                interviewReportId: report._id,
                questionType,
                questionId,
                answer
            })
            setReport(response.interviewReport)
            return response.interviewReport
        }
        catch (err) {
           console.log("Error submitting answer: ", err)
        }
    }

    const startLiveInterview = async (interviewReportId) => {
        const response = await startLiveInterviewApi(interviewReportId)
        return response.interviewLoop
    }

    const submitLiveInterviewAnswer = async ({ interviewReportId, answer }) => {
        const response = await submitLiveAnswerApi({ interviewReportId, answer })
        return {
            score: response.score,
            interviewLoop: response.interviewLoop,
            scoreError: response.scoreError || null,
            performanceReportError: response.performanceReportError || null
        }
    }

    const advanceLiveInterview = async ({ interviewReportId, skipFollowUp }) => {
        const response = await advanceLiveInterviewApi({ interviewReportId, skipFollowUp })
        return { interviewLoop: response.interviewLoop, performanceReportError: response.performanceReportError || null }
    }

    const endLiveInterview = async (interviewReportId) => {
        const response = await endLiveInterviewApi(interviewReportId)
        return { interviewLoop: response.interviewLoop, performanceReportError: response.performanceReportError || null }
    }

    return {
        loading,
        report,
        reports,
        generateReport,
        getReportById,
        getAllReports,
        generateResumePDF,
        submitAnswer,
        startLiveInterview,
        submitLiveInterviewAnswer,
        advanceLiveInterview,
        endLiveInterview
    }

}