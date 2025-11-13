import express from "express";

//const place
const PORT = 3000;
const app = express();

app.get("/", (req, res) => {
  res.json({ message: "File uploader ready!" });
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:3000");
});
