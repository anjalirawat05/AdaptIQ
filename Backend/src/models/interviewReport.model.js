const mongoose = require("mongoose");


const technicalQuestionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : [true, "Question is required"]
    },
    intention : {
        type : String,
        required : [true, "Intention is required"]
    },
    answer : {
        type : String,
        required : [true, "Answer is required"]
    },
    // the candidate's actual submitted answer, as opposed to the AI's suggested `answer` above
    candidateAnswer : {
        type : String
    },
    score : {
        correctness : { type : Number, min : 1, max : 5 },
        depth : { type : Number, min : 1, max : 5 },
        communication : { type : Number, min : 1, max : 5 },
        evidence : { type : String },
        confidence : { type : Number, min : 1, max : 5 },
        needsReview : { type : Boolean }
    }
});

const behavioralQuestionSchema = new mongoose.Schema({
    question : {
        type : String,
        required : [true, "Question is required"]
    },
    intention : {
        type : String,
        required : [true, "Intention is required"]
    },
    answer : {
        type : String,
        required : [true, "Answer is required"]
    },
    // the candidate's actual submitted answer, as opposed to the AI's suggested `answer` above
    candidateAnswer : {
        type : String
    },
    score : {
        correctness : { type : Number, min : 1, max : 5 },
        depth : { type : Number, min : 1, max : 5 },
        communication : { type : Number, min : 1, max : 5 },
        evidence : { type : String },
        confidence : { type : Number, min : 1, max : 5 },
        needsReview : { type : Boolean }
    }
});

const skillGapSchema = new mongoose.Schema({
    skill : {
        type : String,
        required : [true, "Skill is required"]
    },
    importance : {
        type : String,
        enum : ["low", "medium", "high"],
        required : [true, "Importance is required"]
    }
},{
    _id : false
});

const preparationPlanSchema = new mongoose.Schema({
    day : {
        type : Number,
        required : [true, "Day is required"]
    },
    focus :{
        type : String,
        required : [true, "Focus is required"]
    },
    tasks : [{
        type : String,
        required : [true, "Task is required"]
    }]
},{
    _id : false

})
const interviewReportSchema = new mongoose.Schema({
     jobDescription : {
        type : String,
        required : [true, "Job description is required"]
    },
    resume : {
        type : String,

    },
    selfDescription : {
        type : String,
    },
    matchScore : {
        type : Number,
        min : 0,
        max : 100,
    },
    technicalQuestions : [technicalQuestionSchema],
    behavioralQuestions : [behavioralQuestionSchema],
    skillGaps : [skillGapSchema],
    preparationPlan : [preparationPlanSchema],
    title:{
        type : String,
        required : [true, "Title is required"]
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "users"
    },
    // live adaptive-interview loop state, persisted in Mongo (not in memory) so it
    // survives between request/response cycles
    interviewLoop : {
        status : {
            type : String,
            enum : ["not_started", "in_progress", "completed"],
            default : "not_started"
        },
        topicsCovered : [{ type : String }],
        followUpDepth : { type : Number, default : 0 },
        questionCount : { type : Number, default : 0 },
        transcript : [{
            question : String,
            type : { type : String, enum : ["technical", "behavioral"] },
            isFollowUp : Boolean,
            candidateAnswer : String,
            score : {
                correctness : Number,
                depth : Number,
                communication : Number,
                evidence : String,
                confidence : Number,
                needsReview : Boolean
            }
        }],
        currentQuestion : {
            question : String,
            type : { type : String, enum : ["technical", "behavioral"] },
            isFollowUp : { type : Boolean, default : false }
        },
        // the AI's proposed next step after an answer is scored, held here until the
        // candidate confirms it (or overrides it) via the /live/next endpoint
        pendingNext : {
            action : { type : String, enum : ["followUp", "nextTopic"] },
            question : String,
            type : { type : String, enum : ["technical", "behavioral"] },
            followUpDepth : Number,
            questionCount : Number
        },
        performanceReport : {
            strengths : [{ type : String }],
            weaknesses : [{ type : String }],
            verdict : { type : String, enum : ["strong_hire", "hire", "borderline", "no_hire"] },
            summary : { type : String }
        }
    }
},{
    timestamps : true

})

const InterviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);
module.exports = InterviewReportModel