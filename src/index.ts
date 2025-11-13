import express from "express";
import { PrismaClient } from "@prisma/client";

//const place
const PORT = 3000;
const app = express();
const prisma = new PrismaClient();

//root
app.get("/", (req, res) => {
  res.json({ message: "File uploader ready!" });
});

//test route
app.get("/test-db", async (req, res) => {
  const userCount = await prisma.user.count();
  res.json({ message: "DB connected!", users: userCount });
});

//check port
app.listen(PORT, () => {
  console.log("Server running on http://localhost:3000");
});
