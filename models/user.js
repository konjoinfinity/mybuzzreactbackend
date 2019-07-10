const mongoose = require("../db/connection");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const Schema = mongoose.Schema;

const Buzz = new Schema({
  numberOfDrinks: Number,
  drinkType: String,
  hours: Number,
  dateCreated: {
    type: Date,
    default: Date.now()
  },
  holdTime: Date
});

const User = new Schema({
  username: String,
  gender: String,
  weight: Number,
  bac: {
    type: Number,
    default: 0.0
  },
  dateCreated: {
    type: Date,
    default: Date.now()
  },
  buzzes: [Buzz],
  oldbuzzes: [Buzz],
  timeSince: String
});

User.pre("save", function(next) {
  this.password = bcrypt.hashSync(this.password, saltRounds);
  next();
});

User.method("comparePassword", function(password, dbpassword) {
  if (bcrypt.compareSync(password, dbpassword)) {
    return true;
  } else {
    return false;
  }
});

module.exports = mongoose.model("User", User);