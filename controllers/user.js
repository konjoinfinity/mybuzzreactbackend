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

function durationLoop(user, buzzLength, timestamp2) {
  var durations = [];
  var buzzDuration;
  for (i = 0; i < buzzLength; i++) {
    var date2 = timestamp2.getTime();
    var date1 = user.buzzes[i].dateCreated.getTime();
    var dayHourMin = getDayHourMin(date1, date2);
    var days = dayHourMin[0];
    var hours = dayHourMin[1];
    var minutes = dayHourMin[2];
    var seconds = dayHourMin[3];
    if (days >= 1) {
      hours = hours + days * 24;
    }
    if (hours == 0) {
      buzzDuration = minutes / 60 + seconds / 3600;
    } else {
      buzzDuration = hours + minutes / 60 + seconds / 3600;
    }
    durations.push(buzzDuration);
  }
  if (buzzLength == 0) {
    var date2 = timestamp2.getTime();
    var date1 = user.buzzes[i].dateCreated.getTime();
    var dayHourMin = getDayHourMin(date1, date2);
    var days = dayHourMin[0];
    var hours = dayHourMin[1];
    var minutes = dayHourMin[2];
    var seconds = dayHourMin[3];
    if (days >= 1) {
      hours = hours + days * 24;
    }
    if (hours == 0) {
      buzzDuration = minutes / 60 + seconds / 3600;
    } else {
      buzzDuration = hours + minutes / 60 + seconds / 3600;
    }
    durations.push(buzzDuration);
  }
  return durations;
}

function buzzLoop(user, req, durations, ilength) {
  var maxBac = getBAC(user.weight, user.gender, 1, "Beer", 0);
  var buzzHours;
  var totals = [];
  for (i = 0; i < user.buzzes.length; i++) {
    if (i == ilength) {
      buzzHours = 0;
    } else {
      buzzHours = durations[i];
    }
    buzzTotal = getBAC(
      user.weight,
      user.gender,
      user.buzzes[i].numberOfDrinks,
      user.buzzes[i].drinkType,
      buzzHours
    );
    if (buzzTotal > 0) {
      if (i == 0) {
        totals.push(buzzTotal);
      } else {
        if (i > 0 && durations[i - 1] <= 1) {
          totals.push(maxBac);
        } else {
          var holdDate = new Date();
          var date2 = holdDate.getTime();
          var date1 = user.buzzes[i].holdTime.getTime();
          var dayHourMin = getDayHourMin(date1, date2);
          var days = dayHourMin[0];
          var hours = dayHourMin[1];
          var minutes = dayHourMin[2];
          var seconds = dayHourMin[3];
          if (days >= 1) {
            hours = hours + days * 24;
          }
          if (hours == 0) {
            buzzDuration = minutes / 60 + seconds / 3600;
          } else {
            buzzDuration = hours + minutes / 60 + seconds / 3600;
          }
          decayHours = buzzDuration;
          buzzDecay = getBAC(
            user.weight,
            user.gender,
            user.buzzes[i].numberOfDrinks,
            user.buzzes[i].drinkType,
            decayHours
          );
          totals.push(buzzDecay);
        }
      }
    }
    if (buzzTotal <= 0) {
      var oldBuzz = {
        numberOfDrinks: 1,
        drinkType: user.buzzes[i].drinkType,
        hours: 1,
        dateCreated: user.buzzes[i].dateCreated
      };
      var oldBuzzId = { _id: user.buzzes[i]._id };
      User.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { buzzes: oldBuzzId } }
      ).then(user => {
        user.oldbuzzes.push(oldBuzz);
        user.save((err, user) => {
          console.log("Moved buzz to old");
        });
      });
    }
  }
  console.log(totals);
  return totals;
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

router.get("/", (req, res) => {
  User.find({}).then(users => res.json(users));
});

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/signup", (req, res) => {
  res.render("user/signup", { error: req.flash("error") });
});

router.post("/signup", (req, res) => {
  if (req.body.username && req.body.password) {
    if (req.body.password === req.body.confirmpassword) {
      let newUser = {
        username: req.body.username,
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

router.get("/login", (req, res) => {
  res.render("user/login", {
    error: req.flash("error"),
    info: req.flash("info")
  });
});

router.post("/login", (req, res, next) => {
  var success = "You Logged In";
  const authenticate = passport.authenticate("local", function(
    err,
    user,
    info
  ) {
    if (err || !user) {
      req.flash("error", info.message);
      res.redirect("/user/login");
    }
    req.logIn(user, function(err) {
      if (err) {
        req.flash("error", err.message);
        return res.redirect("/user/login");
      }
      req.flash("success", "You Successfully Logged In");
      return res.redirect(`/user/${user._id}`);
    });
  });
  authenticate(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get("/user/:id", (req, res) => {
  var currentTime = new Date();
  var total;
  var buzzDuration;
  var buzzHours;
  var durations = [];
  var totals = [];
  User.findOne({ _id: req.params.id }).then(user => {
    if (user.buzzes.length >= 1) {
      durations = durationLoop(user, user.buzzes.length, currentTime);
      totals = buzzLoop(user, req, durations, user.buzzes.length);
      total = totals.reduce((a, b) => a + b, 0);
      total = parseFloat(total.toFixed(6));
      console.log(total);
      if (total <= 0) {
        if (user.oldbuzzes.length >= 1) {
          User.findOne({ _id: req.params.id }).then(user => {
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
          User.findOne({ _id: req.params.id }).then(user => {
            user.bac = 0;
            user.timeSince = "";
            user.save((err, user) => {
              res.json(user);
            });
          });
        }
      } else {
        User.findOne({ _id: req.params.id }).then(user => {
          user.bac = total;
          user.save((err, user) => {
            res.json(user);
          });
        });
      }
    } else {
      if (user.oldbuzzes.length >= 1) {
        User.findOne({ _id: req.params.id }).then(user => {
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

router.post("/user/:id", (req, res) => {
  var dateTime = new Date();
  var previousDrinkDate;
  User.findOne({ _id: req.params.id })
    .then(user => {
      if (user.buzzes.length == 1) {
        previousDrinkDate = user.buzzes[user.buzzes.length - 1].dateCreated;
        previousDrinkDate.setHours(previousDrinkDate.getHours() + 1);
      }
      if (user.buzzes.length > 1) {
        previousDrinkDate = user.buzzes[user.buzzes.length - 1].holdTime;
        previousDrinkDate.setHours(previousDrinkDate.getHours() + 1);
      }
    })
    .then(e => {
      var newBuzz = {
        numberOfDrinks: 1,
        drinkType: req.body.drinkType,
        hours: 0,
        dateCreated: dateTime
      };
      User.findOne({ _id: req.params.id }).then(user => {
        if (user.buzzes.length >= 1) {
          var newBuzzWithHold = {
            numberOfDrinks: 1,
            drinkType: req.body.drinkType,
            hours: 0,
            dateCreated: dateTime,
            holdTime: previousDrinkDate
          };
          user.buzzes.push(newBuzzWithHold);
        } else {
          user.buzzes.push(newBuzz);
        }
        user.save().then(user => {
          var total;
          var buzzDuration;
          var buzzHours;
          var durations = [];
          var totals = [];
          var duration;
          if (user.buzzes.length == 0) {
            total = getBAC(user.weight, user.gender, 1, req.body.drinkType, 0);
          }
          if (user.buzzes.length >= 1) {
            durations = durationLoop(
              user,
              user.buzzes.length - 1,
              user.buzzes[user.buzzes.length - 1].dateCreated
            );
            totals = buzzLoop(user, req, durations, user.buzzes.length - 1);
            total = totals.reduce((a, b) => a + b, 0);
            total = parseFloat(total.toFixed(6));
            console.log(total);
          }
          user.bac = total;
          user.save((err, user) => {
            res.json(user);
          });
        });
      });
    });
});

router.get("/user/:id/bac", (req, res) => {
  var currentTime = new Date();
  var total;
  var buzzDuration;
  var buzzHours;
  var durations = [];
  var totals = [];
  User.findOne({ _id: req.params.id }).then(user => {
    if (user.buzzes.length >= 1) {
      durations = durationLoop(user, user.buzzes.length, currentTime);
      totals = buzzLoop(user, req, durations, user.buzzes.length);
      total = totals.reduce((a, b) => a + b, 0);
      total = parseFloat(total.toFixed(6));
      console.log(total);
      if (total < 0) {
        user.bac = 0;
        user.save((err, user) => {
          res.json(user);
        });
      } else {
        user.bac = total;
        user.save((err, user) => {
          res.json(user);
        });
      }
    } else {
      user.bac = total;
      user.save((err, user) => {
        res.json(user);
      });
    }
  });
});

router.put("/user/:id/del", (req, res) => {
  var buzzId = { _id: req.body.index };
  User.findOneAndUpdate(
    { _id: req.params.id },
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

router.put("/user/:id/olddel", (req, res) => {
  var buzzId = { _id: req.body.index };
  User.findOneAndUpdate(
    { _id: req.params.id },
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

router.put("/user/:id/delall", (req, res) => {
  User.findOneAndUpdate({ _id: req.params.id }, { $pull: { buzzes: {} } }).then(
    user => {
      user.bac = 0;
      user.save((err, user) => {
        res.json(user);
      });
    }
  );
});

router.put("/user/:id/olddelall", (req, res) => {
  User.findOneAndUpdate(
    { _id: req.params.id },
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

module.exports = router;