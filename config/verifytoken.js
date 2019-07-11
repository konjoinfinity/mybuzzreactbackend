const mongoose = require("../db/connection");
const jwt = require("jwt-simple");
const config = require("../config/config");
const User = mongoose.model("User");

function verifyToken(req, res, next) {
  var token = req.headers["user-token"];
  if (!token)
    return res.status(401).send({ auth: false, message: "No token provided." });
  try {
    var decoded = jwt.decode(token, config.jwtSecret);
  } catch (error) {
    return res
      .status(500)
      .send({ auth: false, message: "Failed to authenticate token." });
  }
  decodedId = decoded.id;
  next();
}

module.exports = verifyToken;
