import express from "express";
import User from "../models/User";
import parseErrors from "../utils/parseErrors";
import { sendConfirmationEmail } from "../mailer";

const router = express.Router();

const ChatKit = require('pusher-chatkit-server')

const chatkit = new ChatKit.default({
  instanceLocator: 'v1:us1:8bc1011c-33d7-4b48-9970-62f4d1232918',
  key: '1bafbc7b-b644-497d-9bd1-f559debae0d0:RX4SjvCIyb7oVVWSjmisJAV2mnHMEwKeej0fUCYZJEI='
})

router.post("/", (req, res) => {
  const { email, password } = req.body.user;
  const user = new User({ email });
  user.setPassword(password);
  user.createChatUser(email);
  user.setConfirmationToken();
  user
    .save()
    .then(userRecord => {
      sendConfirmationEmail(userRecord);
      res.json({ user: userRecord.toAuthJSON() });
    })
    .catch(err => res.status(400).json({ errors: parseErrors(err.errors) }));
});

export default router;
