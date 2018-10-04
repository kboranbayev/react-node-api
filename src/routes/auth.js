import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { sendResetPasswordEmail } from "../mailer";

const ChatKit = require('pusher-chatkit-server')

const chatkit = new ChatKit.default({
  instanceLocator: 'v1:us1:8bc1011c-33d7-4b48-9970-62f4d1232918',
  key: '1bafbc7b-b644-497d-9bd1-f559debae0d0:RX4SjvCIyb7oVVWSjmisJAV2mnHMEwKeej0fUCYZJEI='
})

const router = express.Router();

router.post("/", (req, res) => {
  const { credentials } = req.body;
  User.findOne({ email: credentials.email }).then(user => {
    if (user && user.isValidPassword(credentials.password)) {
      res.json({ user: user.toAuthJSON() });
    } else {
      res.status(400).json({ errors: { global: "Invalid credentials" } });
    }
  });
});

/*
  TODO: insecure link to chatkit
*/
router.post("/chatkit", (req, res) => {
  const authData = chatkit.authenticate({ userId: req.query.user_id })
  res.status(authData.status).send(authData.body);
});

router.post("/confirmation", (req, res) => {
  const token = req.body.token;
  User.findOneAndUpdate(
    { confirmationToken: token },
    { confirmationToken: "", confirmed: true },
    { new: true }
  ).then(
    user =>
      user ? res.json({ user: user.toAuthJSON() }) : res.status(400).json({})
  );
});

router.post("/reset_password_request", (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      sendResetPasswordEmail(user);
      res.json({});
    } else {
      res
        .status(400)
        .json({ errors: { global: "There is no user with such email" } });
    }
  });
});

router.post("/validate_token", (req, res) => {
  jwt.verify(req.body.token, process.env.JWT_SECRET, err => {
    if (err) {
      res.status(401).json({});
    } else {
      res.json({});
    }
  });
});

router.post("/reset_password", (req, res) => {
  const { password, token } = req.body.data;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ errors: { global: "Invalid token" } });
    } else {
      User.findOne({ _id: decoded._id }).then(user => {
        if (user) {
          user.setPassword(password);
          user.save().then(() => res.json({}));
        } else {
          res.status(404).json({ errors: { global: "Invalid token" } });
        }
      });
    }
  });
});

export default router;
