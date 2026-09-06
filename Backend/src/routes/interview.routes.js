const express = require("express")
const authmiddleware = require('../middlewares/authmiddleware')
const interviewController = require("../controllers/interview.controller.js")
const upload  = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

 /**
  * @route POST/api/interview/
  * @description generate new interview report ont the basis of description,
  *  resume pdf and job description
  *  @access private
  * since access is private, authmiddleware is used
  */

interviewRouter.post("/", authmiddleware.authuser, upload.single("resume"), interviewController.generateInterviewReportController)

/**
 * @route GET/api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 * 
 */
interviewRouter.get("/report/:interviewId", authmiddleware.authuser, interviewController.getInterviewReportByIdController)

/**
 * @route GET/api/interview/
 * @description get all interview reports of the logged in user.
 * @access private
 */
interviewRouter.get("/", authmiddleware.authuser, interviewController.getAllInterviewReportsController)

/**
 * @route GET/api/interview/resume/pdf/:interviewReportId
 * @description generate resume pdf based on the interview report
 * @access private
 */
interviewRouter.get("/resume/pdf/:interviewReportId", authmiddleware.authuser, interviewController.generateResumePDFController)



/**
 * @route POST /api/interview/:interviewReportId/:questionType/:questionId/answer
 * @description submit candidate's answer to a specific question (technical/behavioral)
 * @access private
 */
interviewRouter.post(
    "/:interviewReportId/:questionType/:questionId/answer",
    authmiddleware.authuser,
    interviewController.submitAnswerController
)

/**
 * @route POST /api/interview/:interviewReportId/live/start
 * @description start a live adaptive interview for a report
 * @access private
 */
interviewRouter.post(
    "/:interviewReportId/live/start",
    authmiddleware.authuser,
    interviewController.startLiveInterviewController
)

/**
 * @route POST /api/interview/:interviewReportId/live/answer
 * @description submit an answer during a live adaptive interview and get the next action
 * @access private
 */
interviewRouter.post(
    "/:interviewReportId/live/answer",
    authmiddleware.authuser,
    interviewController.submitLiveAnswerController
)

/**
 * @route POST /api/interview/:interviewReportId/live/next
 * @description confirm (or override with skipFollowUp) the AI's proposed next question
 * @access private
 */
interviewRouter.post(
    "/:interviewReportId/live/next",
    authmiddleware.authuser,
    interviewController.advanceLiveInterviewController
)

/**
 * @route POST /api/interview/:interviewReportId/live/end
 * @description manually end a live interview in progress
 * @access private
 */
interviewRouter.post(
    "/:interviewReportId/live/end",
    authmiddleware.authuser,
    interviewController.endLiveInterviewController
)

module.exports = interviewRouter

