import passport from "passport";
import bcrypt from "bcryptjs";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      //1. find user by user in User table
      const user = await prisma.user.findUnique({
        where: { username: username },
      });

      //2. if user not found return error message
      if (!user) {
        return done(null, false, { message: "User not found" });
      }

      //3. compare with the enter username
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Wrong password" });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }),
);

// store only the id of user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const userId = await prisma.user.findUnique({
      where: { id: id },
    });
    done(null, userId);
  } catch (error) {
    done(error);
  }
});

export default passport;
