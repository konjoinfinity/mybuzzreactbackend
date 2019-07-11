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

//Discovered that the password hash changes after every user
//modification, it rehases the hashed password....

User.pre("save", function(next) {
  this.password = bcrypt.hashSync(this.password, saltRounds);
  console.log(this.password);
  next();
});

User.method("comparePassword", function(password, dbpassword) {
  console.log(password);
  console.log(dbpassword);
  if (bcrypt.compareSync(password, dbpassword)) {
    return true;
  } else {
    return false;
  }
});

module.exports = mongoose.model("User", User);
