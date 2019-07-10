const mongoose = require("./connection");
const User = require("../models/user");
mongoose.Promise = Promise;

User.deleteMany({})
  .then(() => {
    User.create({
      email: "c.blundon@gmail.com",
      gender: "Male",
      weight: 180,
      password: "Test123",
      buzzes: [
        {
          numberOfDrinks: 1,
          drinkType: "Beer",
          hours: 1
        }
      ],
      oldbuzzes: [
        {
          numberOfDrinks: 1,
          drinkType: "Beer",
          hours: 1,
          dateCreated: Date.now()
        }
      ]
    }).then(console.log("User Created"));
  })
  .then(console.log("Users Deleted"));
User.create({
  username: "wesleyscholl@gmail.com",
  gender: "Male",
  weight: 210,
  password: "777bmx777",
  oldbuzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1,
      dateCreated: Date.now()
    },
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1,
      dateCreated: Date.now()
    }
  ]
}).then(console.log("User Created"));

User.create({
  username: "julie@julie.com",
  gender: "Female",
  weight: 150,
  password: "whywhywhy",
  buzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Wine",
      hours: 1
    }
  ],
  oldbuzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Wine",
      hours: 1,
      dateCreated: Date.now()
    },
    {
      numberOfDrinks: 1,
      drinkType: "Wine",
      hours: 1,
      dateCreated: Date.now()
    }
  ]
}).then(console.log("User Created"));

User.create({
  username: "brian@brian.com",
  gender: "Male",
  weight: 190,
  password: "hellohello",
  buzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Liquor",
      hours: 1
    },
    {
      numberOfDrinks: 1,
      drinkType: "Liquor",
      hours: 1
    }
  ],
  oldbuzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Liquor",
      hours: 1,
      dateCreated: Date.now()
    },
    {
      numberOfDrinks: 1,
      drinkType: "Liquor",
      hours: 1,
      dateCreated: Date.now()
    }
  ]
}).then(console.log("User Created"));

User.create({
  username: "tim@tim.com",
  gender: "Male",
  weight: 210,
  password: "byebyebye",
  buzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Liquor",
      hours: 1
    }
  ],
  oldbuzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1,
      dateCreated: Date.now()
    },
    {
      numberOfDrinks: 1,
      drinkType: "Wine",
      hours: 1,
      dateCreated: Date.now()
    }
  ]
}).then(console.log("User Created"));

User.create({
  username: "kate@kate.com",
  gender: "Female",
  weight: 140,
  password: "sighsighsigh",
  buzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1
    },
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1
    },
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1
    }
  ],
  oldbuzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1,
      dateCreated: Date.now()
    },
    {
      numberOfDrinks: 1,
      drinkType: "Beer",
      hours: 1,
      dateCreated: Date.now()
    }
  ]
}).then(console.log("User Created"));

User.create({
  username: "james@james.com",
  gender: "Male",
  weight: 200,
  password: "hihihi",
  buzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Wine",
      hours: 1
    }
  ],
  oldbuzzes: [
    {
      numberOfDrinks: 1,
      drinkType: "Wine",
      hours: 1,
      dateCreated: Date.now()
    },
    {
      numberOfDrinks: 1,
      drinkType: "Wine",
      hours: 1,
      dateCreated: Date.now()
    }
  ]
}).then(console.log("Last User Created"));
