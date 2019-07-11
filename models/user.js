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
  email: String,
  gender: String,
  weight: Number,
  password: String,
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
  timeSince: String,
  created: {
    type: Boolean,
    default: true
  }
});

User.pre("save", function(next) {
  var currentDate = new Date();
  if (currentDate - this.dateCreated <= 2000) {
    this.password = bcrypt.hashSync(this.password, saltRounds);
  }
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
