const dotenv = require("dotenv")
dotenv.config()
const app = require('./src/app')
const ConnecttoDB = require('./src/config/database')

ConnecttoDB()

app.listen( 3000 , () => {
    console.log("server is running on port 3000")
})