import express from "express";
import cors from "cors";
import passport from "passport";
import setupPassport from "./middleware/setup-passport";
import setupSession from "./middleware/setup-session";
import authRouter from "./routers/auth-router";
import apiRouter from "./routers/api-router";
import inProd from "./lib/inProd";
import feedbackRouter from "./routers/feedback-router";
import paymentRouter from "./routers/payment-router";

const app = express();

// MIDDLEWARE AND SETUP 🔧 //
app.set("view engine", "ejs");
app.use("/payment/webhook", express.raw({type: "*/*"}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors({
    origin: inProd ? /\.lingdocs\.com$/ : "*",
    credentials: true,
}));
if (inProd) app.set('trust proxy', 1);
setupSession(app);
app.use(passport.initialize());
app.use(passport.session());
setupPassport(passport);

 // Web Interface - returning html (mostly)
app.use("/", authRouter(passport));
 // REST API - returning json
app.use("/api", apiRouter);
app.use("/feedback", feedbackRouter);
app.use("/payment", paymentRouter);

// START 💨 //
app.listen(4000, () => console.log("Server Has Started on 4000"));
