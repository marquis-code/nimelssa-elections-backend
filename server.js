const express = require("express");
const app = express();
const morgan = require("morgan");
const helment = require("helmet");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const cookieParser = require("cookie-parser");
const port = process.env.PORT || 3000;
const connectDB = require("./config/db.config");

connectDB();

const corsOptions = {
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(helment());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const userRouter = require("./routes/user");
const electionRouter = require("./routes/election");

app.use("/api/auth", userRouter);
app.use("/api/election", electionRouter);

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});


module.exports = app;
