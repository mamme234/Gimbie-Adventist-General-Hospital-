const mongoose = require("mongoose");
require("dotenv").config();

const options = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

async function connect() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(process.env.MONGODB_URI, options);
  console.log("✅ MongoDB Connected");
}

async function disconnect() {
  await mongoose.connection.close();
}

function getConnectionStatus() {
  return {
    state: mongoose.connection.readyState,
    name: mongoose.connection.name || "Unknown"
  };
}

module.exports = {
  connect,
  disconnect,
  getConnectionStatus
};
