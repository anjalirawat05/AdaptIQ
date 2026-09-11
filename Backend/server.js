const dotenv = require("dotenv");

dotenv.config();

const app = require('./src/app');

const ConnecttoDB = require('./src/config/database');

ConnecttoDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});