
import session from "express-session";
import MongoStore from "connect-mongo";

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is missing from environment variables");
}

const mongoUrl = process.env.MONGODB_URI;

if (!mongoUrl) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

export const sessionMiddleware = session({
  name: process.env.SESSION_COOKIE_NAME || "sms.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,

  store: MongoStore.create({
    mongoUrl,
    collectionName: "sessions",
    ttl: 60 * 60 * 24,
  }),

  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
});
