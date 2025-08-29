import dotenv from "dotenv";
import express from "express";

dotenv.config();
const app = express();

app.get("/", (req, res) => {
  return res.json({
    message: "Hello, world!",
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
