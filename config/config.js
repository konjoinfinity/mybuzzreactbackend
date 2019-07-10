if (process.env.NODE_ENV == "production") {
  prodDevSecret = process.env.PROD_SECRET;
} else {
  prodDevSecret = "MyBuZzH3Lp5P30p1312345678";
}

module.exports = {
  jwtSecret: prodDevSecret,
  jwtSession: {
    session: false
  }
};
