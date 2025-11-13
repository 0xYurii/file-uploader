import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import passport from "passport";

const router = Router();
const prisma = new PrismaClient();

//sign up Route
router.post("/signup", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    //hash password
    const hash = await bcrypt.hash(passport, 10);

    //creat user
    const user = await prisma.user.create({
      data: { username, password: hash, email },
    });

    res.status(201).json({
      message: "User created!",
      userId: user.id,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

//login route
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({
    message: "Logged in!",
    user: req.user,
  });
});

//log out route
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logged out!" });
  });
});

export default router;
