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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
