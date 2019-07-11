const express = require("express");
const router = express.Router();
const mongoose = require("../db/connection");
const User = require("../models/user");
const passport = require("../config/passport");
const jwt = require("jwt-simple");
const config = require("../config/config");
const saltRounds = 10;
const bcrypt = require("bcrypt");
const verifyToken = require("../config/verifytoken");

function getDayHourMin(date1, date2) {
  var dateDiff = date2 - date1;
  dateDiff = dateDiff / 1000;
  var seconds = Math.floor(dateDiff % 60);
  dateDiff = dateDiff / 60;
  var minutes = Math.floor(dateDiff % 60);
  dateDiff = dateDiff / 60;
  var hours = Math.floor(dateDiff % 24);
  var days = Math.floor(dateDiff / 24);
  return [days, hours, minutes, seconds];
}

function singleDuration(initialbuzz) {
  var duration;
  var currentDate = new Date();
  var date2 = currentDate.getTime();
  var date1 = initialbuzz.getTime();
  var dayHourMin = getDayHourMin(date1, date2);
  var days = dayHourMin[0];
  var hours = dayHourMin[1];
  var minutes = dayHourMin[2];
  var seconds = dayHourMin[3];
  if (days >= 1) {
    hours = hours + days * 24;
  }
  if (hours == 0) {
    duration = minutes / 60 + seconds / 3600;
  } else {
    duration = hours + minutes / 60 + seconds / 3600;
  }
  return duration;
}

function getBAC(weight, gender, drinks, drinkType, hours) {
  var distribution;
  if (gender == "Female") {
    distribution = 0.66;
  }
  if (gender == "Male") {
    distribution = 0.73;
  }
  var totalAlc;
  if (drinkType == "Beer") {
    totalAlc = 12 * drinks * 0.05;
  }
  if (drinkType == "Wine") {
    totalAlc = 5 * drinks * 0.12;
  }
  if (drinkType == "Liquor") {
    totalAlc = 1.5 * drinks * 0.4;
  }
  var bac = (totalAlc * 5.14) / (weight * distribution) - 0.015 * hours;
  return bac;
}

router.get("/", verifyToken, (req, res) => {
  User.findById(decodedId, { password: 0 }, (err, user) => {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    var currentTime = new Date();
    var totalBac;
    var duration;
    User.findOne({ _id: decodedId }).then(user => {
      if (user.buzzes.length >= 1) {
        duration = singleDuration(user.buzzes[0].dateCreated);
        totalBac = getBAC(
          user.weight,
          user.gender,
          user.buzzes.length,
          "Liquor",
          duration
        );
        totalBac = parseFloat(totalBac.toFixed(6));
        if (totalBac <= 0) {
          for (i = 0; i < user.buzzes.length; i++) {
            var oldBuzz = {
              numberOfDrinks: 1,
              drinkType: user.buzzes[i].drinkType,
              hours: 1,
              dateCreated: user.buzzes[i].dateCreated
            };
            var oldBuzzId = { _id: user.buzzes[i]._id };
            User.findOneAndUpdate(
              { _id: decodedId },
              { $pull: { buzzes: oldBuzzId } }
            ).then(user => {
              user.oldbuzzes.push(oldBuzz);
              user.save((err, user) => {
                console.log("Moved buzz to old");
              });
            });
          }
          if (user.oldbuzzes.length >= 1) {
            User.findOne({ _id: decodedId }).then(user => {
              var date2 = currentTime.getTime();
              var date1 = user.oldbuzzes[
                user.oldbuzzes.length - 1
              ].dateCreated.getTime();
              var dayHourMin = getDayHourMin(date1, date2);
              var days = dayHourMin[0];
              var hours = dayHourMin[1];
              var minutes = dayHourMin[2];
              var seconds = dayHourMin[3];
              user.timeSince = `${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
              user.bac = 0;
              user.save((err, user) => {
                res.json(user);
              });
            });
          } else {
            User.findOne({ _id: decodedId }).then(user => {
              user.bac = 0;
              user.timeSince = "";
              user.save((err, user) => {
                res.json(user);
              });
            });
          }
        } else {
          User.findOne({ _id: decodedId }).then(user => {
            user.bac = totalBac;
            user.save((err, user) => {
              res.json(user);
            });
          });
        }
      } else {
        if (user.oldbuzzes.length >= 1) {
          User.findOne({ _id: decodedId }).then(user => {
            var date2 = currentTime.getTime();
            var date1 = user.oldbuzzes[
              user.oldbuzzes.length - 1
            ].dateCreated.getTime();
            var dayHourMin = getDayHourMin(date1, date2);
            var days = dayHourMin[0];
            var hours = dayHourMin[1];
            var minutes = dayHourMin[2];
            var seconds = dayHourMin[3];
            if ((user.buzzes.length = 0)) {
              user.bac = 0;
            }
            user.timeSince = `${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds`;
            user.save((err, user) => {
              res.json(user);
            });
          });
        } else {
          if (user.buzzes.length == 0) {
            user.timeSince = "";
            user.bac = 0;
          }
          user.save((err, user) => {
            res.json(user);
          });
        }
      }
    });
  });
});

router.post("/signup", (req, res) => {
  if (req.body.email && req.body.password) {
    if (req.body.password === req.body.confirmpassword) {
      let newUser = {
        email: req.body.email,
        password: req.body.password,
        gender: req.body.gender,
        weight: req.body.weight
      };
      User.findOne({ email: req.body.email }).then(user => {
        if (!user) {
          User.create(newUser).then(user => {
            if (user) {
              var payload = {
                id: user.id
              };
              var token = jwt.encode(payload, config.jwtSecret);
              res.json({
                token: token
              });
            } else {
              res.json({
                error: "Error in user creation"
              });
            }
          });
        } else {
          res.json({
            error: "Email has already been registered"
          });
        }
      });
    } else {
      res.json({
        error: "Passwords don't match"
      });
    }
  } else {
    res.json({
      error: "Please enter both email and password"
    });
  }
});

router.post("/login", (req, res) => {
  if (req.body.email && req.body.password) {
    User.findOne({ email: req.body.email }).then(user => {
      if (user) {
        let success = user.comparePassword(req.body.password, user.password);
        if (success === true) {
          var payload = {
            id: user.id
          };
          var token = jwt.encode(payload, config.jwtSecret);
          res.json({
            token: token
          });
        } else {
          res.json({
            error: "Password does not match email account"
          });
        }
      } else {
        res.json({
          error: "Email has not been registered"
        });
      }
    });
  } else {
    res.json({
      error: "Please enter both email and password"
    });
  }
});

router.post("/", verifyToken, (req, res) => {
  User.findById(decodedId, { password: 0 }, (err, user) => {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    var dateTime = new Date();
    var totalBac;
    var duration;
    var newBuzz = {
      numberOfDrinks: 1,
      drinkType: req.body.drinkType,
      hours: 0,
      dateCreated: dateTime
    };
    User.findOne({ _id: decodedId }).then(user => {
      user.buzzes.push(newBuzz);
      user.save().then(user => {
        if (user.buzzes.length == 0) {
          totalBac = getBAC(user.weight, user.gender, 1, req.body.drinkType, 0);
        }
        if (user.buzzes.length >= 1) {
          duration = singleDuration(user.buzzes[0].dateCreated);
          totalBac = getBAC(
            user.weight,
            user.gender,
            user.buzzes.length,
            "Liquor",
            duration
          );
          totalBac = parseFloat(totalBac.toFixed(6));
        }
        user.bac = totalBac;
        user.save((err, user) => {
          res.json(user);
        });
      });
    });
  });
});

router.get("/bac", verifyToken, (req, res) => {
  User.findById(decodedId, { password: 0 }, (err, user) => {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    var totalBac;
    var duration;
    User.findOne({ _id: decodedId }).then(user => {
      if (user.buzzes.length >= 1) {
        duration = singleDuration(user.buzzes[0].dateCreated);
        totalBac = getBAC(
          user.weight,
          user.gender,
          user.buzzes.length,
          "Liquor",
          duration
        );
        totalBac = parseFloat(totalBac.toFixed(6));
        if (totalBac < 0) {
          user.bac = 0;
          user.save((err, user) => {
            res.json(user);
          });
        } else {
          user.bac = totalBac;
          user.save((err, user) => {
            res.json(user);
          });
        }
      } else {
        user.bac = totalBac;
        user.save((err, user) => {
          res.json(user);
        });
      }
    });
  });
});

router.put("del", verifyToken, (req, res) => {
  User.findById(decodedId, { password: 0 }, (err, user) => {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    var buzzId = { _id: req.body.index };
    User.findOneAndUpdate(
      { _id: decodedId },
      { $pull: { buzzes: buzzId } }
    ).then(user => {
      if (user.buzzes.length == 1) {
        user.bac = 0;
      }
      user.save((err, user) => {
        res.json(user);
      });
    });
  });
});

router.put("olddel", verifyToken, (req, res) => {
  User.findById(decodedId, { password: 0 }, (err, user) => {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    var buzzId = { _id: req.body.index };
    User.findOneAndUpdate(
      { _id: decodedId },
      { $pull: { oldbuzzes: buzzId } }
    ).then(user => {
      if (user.buzzes.length == 1) {
        user.bac = 0;
      }
      user.save((err, user) => {
        res.json(user);
      });
    });
  });
});

router.put("delall", verifyToken, (req, res) => {
  User.findById(decodedId, { password: 0 }, (err, user) => {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    User.findOneAndUpdate({ _id: decodedId }, { $pull: { buzzes: {} } }).then(
      user => {
        user.bac = 0;
        user.save((err, user) => {
          res.json(user);
        });
      }
    );
  });
});

router.put("olddelall", verifyToken, (req, res) => {
  User.findById(decodedId, { password: 0 }, (err, user) => {
    if (err)
      return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    User.findOneAndUpdate(
      { _id: decodedId },
      { $pull: { oldbuzzes: {} } }
    ).then(user => {
      if (user.buzzes.length == 1) {
        user.bac = 0;
      }
      user.save((err, user) => {
        res.json(user);
      });
    });
  });
});

module.exports = router;
