import express from "express";
import session from "express-session";
import passport from "passport";
import { PrismaClient } from "@prisma/client";
import "./config/passport.js";
import router from "./routes/auth.js";
import fileRoutes from "./routes/file.js";

//const place
const PORT = 3000;
const app = express();
const prisma = new PrismaClient();

//Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: "ASMR", // ← Use env variable in production
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  }),
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", router);

app.use("/api", fileRoutes);
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
