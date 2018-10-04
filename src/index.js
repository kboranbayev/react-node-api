import express from "express";
import path from "path";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import Promise from "bluebird";

import auth from "./routes/auth";
import users from "./routes/users";

dotenv.config();
const app = express();
const port = process.env.PORT || 8081;

app.set('port', (process.env.PORT || 8081));

app.use(bodyParser.json());
mongoose.Promise = Promise;
mongoose
  .connect(process.env.MONGODB_URL, { useNewUrlParser: true })
  .catch(err => console.error(err));

app.use("/api/auth", auth);
app.use("/api/users", users);

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => console.log("Running on localhost: " + port));
