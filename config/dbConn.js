const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.DATABASE_URI.replace("<password>", process.env.DATABASE_PSSWD)
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = connectDB;
