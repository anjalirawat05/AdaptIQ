const express = require('express');
const app = express();
const cookieParser = require("cookie-parser")
const cors = require("cors")

app.use(cookieParser())
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))


const authrouter = require("./routes/authroutes")
const interviewRouter = require("./routes/interview.routes")

app.use('/api/auth',authrouter)
app.use('/api/interview', interviewRouter)






module.exports = app
