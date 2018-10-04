import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uniqueValidator from "mongoose-unique-validator";

const ChatKit = require('pusher-chatkit-server')

const chatkit = new ChatKit.default({
  instanceLocator: 'v1:us1:8bc1011c-33d7-4b48-9970-62f4d1232918',
  key: '1bafbc7b-b644-497d-9bd1-f559debae0d0:RX4SjvCIyb7oVVWSjmisJAV2mnHMEwKeej0fUCYZJEI='
})

// TODO: add uniqueness and email validations to email field
const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      unique: true
    },
    passwordHash: { type: String, required: true },
    confirmed: { type: Boolean, default: false },
    confirmationToken: { type: String, default: "" },
    firstname: {
      type: String
    },
    lastname: {
      type: String
    },
  },
  { timestamps: true }
);

schema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

schema.methods.setPassword = function setPassword(password) {
  this.passwordHash = bcrypt.hashSync(password, 10);
};

schema.methods.setConfirmationToken = function setConfirmationToken() {
  this.confirmationToken = this.generateJWT();
};

schema.methods.generateConfirmationUrl = function generateConfirmationUrl() {
  return `${process.env.HOST}/confirmation/${this.confirmationToken}`;
};

schema.methods.generateResetPasswordLink = function generateResetPasswordLink() {
  return `${process.env
    .HOST}/reset_password/${this.generateResetPasswordToken()}`;
};

schema.methods.generateJWT = function generateJWT() {
  return jwt.sign(
    {
      email: this.email,
      confirmed: this.confirmed
    },
    process.env.JWT_SECRET
  );
};

schema.methods.generateResetPasswordToken = function generateResetPasswordToken() {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

schema.methods.isInPusherServer = function isInPusherServer(email) {
  const authData = chatkit.authenticate({
      userId: email
    }); 
  return authData;
}

schema.methods.toAuthJSON = function toAuthJSON() {
  return {
    email: this.email,
    confirmed: this.confirmed,
    token: this.generateJWT(),
    chatkitData: this.isInPusherServer(this.email)
  };
};

schema.methods.createChatUser = function createChatUser(email) {
  chatkit.createUser({
    name: email,
    id: email
  })
    .then(() => res.sendStatus(201)
    .catch(err => {
      if (error.err === 'services/chatkit/user_already_exists') {
        return true;
      } else {
        return ({errors: {global: "Cannot validate user to Chatkit server. "}});
      }
    })
  )
}

schema.plugin(uniqueValidator, { message: "This email is already taken" });

export default mongoose.model("User", schema);
