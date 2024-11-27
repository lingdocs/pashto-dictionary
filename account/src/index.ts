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
import dictionaryRouter from "./routers/dictionary-router";
import submissionsRouter from "./routers/submissions-router";

const sameOriginCorsOpts = {
  origin: inProd ? /\.lingdocs\.com$/ : "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
const app = express();

// MIDDLEWARE AND SETUP 🔧 //
app.set("view engine", "ejs");
app.use("/payment/webhook", express.raw({ type: "*/*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

if (inProd) app.set("trust proxy", 1);
setupSession(app);
app.use(passport.initialize());
app.use(passport.session());
setupPassport(passport);

app.get("/test", cors(), (req, res) => {
  res.send({ ok: true });
});

// Dictionary API
app.options("/dictionary", cors());
app.use("/dictionary", cors(), dictionaryRouter);

// Web Interface - returning html (mostly)
app.use("/", cors(sameOriginCorsOpts), authRouter(passport));
// REST API - returning json
app.use("/api", cors(sameOriginCorsOpts), apiRouter);
app.use("/feedback", cors(sameOriginCorsOpts), feedbackRouter);
app.use("/submissions", cors(sameOriginCorsOpts), submissionsRouter);
// TODO: check - does this work with the cors ?
app.use("/payment", cors(sameOriginCorsOpts), paymentRouter);

// START 💨 //
app.listen(4000, () => console.log("Server Has Started on 4000"));
