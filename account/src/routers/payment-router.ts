import express from "express";
import * as T from "../../../website/src/types/account-types";
import env from "../lib/env-vars";
import Stripe from "stripe";
import { downgradeUser, upgradeUser } from "../lib/user-utils";
import { addToPaymentsDb } from "../lib/couch-db";

const stripe = new Stripe(env.stripeSecretKey, {
    apiVersion: "2022-08-01",
});

const paymentRouter = express.Router();

paymentRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    let event = request.body;
    // Replace this endpoint secret with your endpoint's unique secret
    // If you are testing with the CLI, find the secret by running 'stripe listen'
    // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    // at https://dashboard.stripe.com/webhooks
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    const endpointSecret = env.stripeWebhookSecret;
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers['stripe-signature'] || "";
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err: any) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }
    let subscription: Stripe.Subscription;
    // Handle the event
    const userId = event.data.object.metadata.userId as T.UUID;
    switch (event.type) {
      case 'customer.subscription.deleted':
        subscription = event.data.object;
        addToPaymentsDb({
          action: "deleted",
          subscription,
        });
        await downgradeUser(userId);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case 'customer.subscription.created':
        subscription = event.data.object;
        addToPaymentsDb({
          action: "created",
          subscription,
        });
        await upgradeUser(userId, subscription);
        // TODO: save subscription to db
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

// Guard all api with authentication
paymentRouter.use((req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    const r: T.APIResponse = { ok: false, error: "401 Unauthorized" };
    return res.status(401).send(r);
});

paymentRouter.post("/create-checkout-session", async (req, res, next) => {
    if (!req.user) {
      return next("not logged in");
    }
    try {
        const source = req.query.source;
        const returnUrl = source === "account"
          ? "https://dictionary.lingdocs.com/account"
          : source === "wordlist"
          ? "https://dictionary.lingdocs.com"
          : "https://account.lingdocs.com/user";
        const price = req.body.priceId;
        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            line_items: [
                {
                  price,
                  quantity: 1,
                },
            ],
            subscription_data: {
              metadata: {
                userId: req.user.userId,
                startTime: Date.now(),
                cycle: price === "price_1Lt8NqJnpCQCjf9pN7CQUjjO"
                  ? "monthly" : "yearly",
              },
            },
            mode: 'subscription',
            success_url: returnUrl,
            cancel_url: returnUrl,
        });
        if (!session.url) {
            return next("error creating session url");
        }
        res.redirect(303, session.url);
    } catch (err) {
        console.error(err);
        return next("error connection to Stripe");
    }
});

paymentRouter.post('/create-portal-session', async (req, res, next) => {
    if (!req.user) {
        return next("error finding user");
    }
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: req.user.userId,
        return_url: "/",
    });
  
    res.redirect(303, portalSession.url);
});


export default paymentRouter;