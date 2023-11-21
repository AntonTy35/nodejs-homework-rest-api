const mongoose = require("mongoose");

const app = require("./app");

mongoose.Promise = global.Promise;

const { DB_URI, PORT = 3000 } = process.env;
mongoose.set("strictQuery", true);

mongoose
  .connect(DB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log("Database connection successful");
      console.log("Server running. Use our API on port: 3000");
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });
