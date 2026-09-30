import express from "express";
import cors from "cors";
import marketsRouter from "./routes/markets";
import vendorsRouter from "./routes/vendors";
import usersRouter from "./routes/users";
import authRouter from "./routes/auth";
import applicationsRouter from "./routes/applications";
import reviewsRouter from "./routes/reviews";
import adminRouter from "./routes/admin";
// Phase 2A routes
import organizerAccountsRouter from "./routes/organizerAccounts";
import marketEventsRouter from "./routes/marketEvents";
import marketApplicationsRouter from "./routes/marketApplications";
import vendorApplicationsRouter from "./routes/vendorApplications";
import followsRouter from "./routes/follows";
import brevoRouter from "./routes/brevo";
import stripeRouter from "./routes/stripe";
import contactRouter from "./routes/contact";
import { attachUser } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 4000;

// Render runs behind one proxy — trust it so req.ip is the visitor's real IP
// (otherwise rate limits are shared by every visitor)
app.set("trust proxy", 1);

// Only our own sites may call the API from a browser. (Requests with no Origin
// header — Stripe webhooks, server-to-server calls — are not affected by CORS.)
const ALLOWED_ORIGINS = [
  "https://www.vimarkets.ca",
  "https://vimarkets.ca",
  "https://vi-markets-network.vercel.app",
  "http://localhost:3000",
];
// Vercel preview deployments of this project (branch alias and per-build URLs)
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/vi-markets-network-[a-z0-9-]+-keramchs-projects\.vercel\.app$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || VERCEL_PREVIEW_ORIGIN.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
}));

// Stripe webhook MUST be registered before express.json() — raw body required for signature verification
app.use("/stripe", stripeRouter);

app.use(express.json());

// Identify the caller (if signed in) on every route below. Does not block anything.
app.use(attachUser);

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "VI Markets backend is running 🎉" });
});

app.use("/markets", marketsRouter);
app.use("/vendors", vendorsRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/applications", applicationsRouter);
app.use("/reviews", reviewsRouter);
app.use("/admin", adminRouter);
// Phase 2A routes
app.use("/organizer-accounts", organizerAccountsRouter);
app.use("/market-events", marketEventsRouter);
app.use("/market-applications", marketApplicationsRouter);
app.use("/vendor-applications", vendorApplicationsRouter);
app.use("/follows", followsRouter);
app.use("/brevo", brevoRouter);
app.use("/contact", contactRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
