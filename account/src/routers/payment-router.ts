import express from "express";
import * as T from "../../../website/src/types/account-types";
import env from "../lib/env-vars";
import Stripe from "stripe";

const stripe = new Stripe(env.stripeSecretKey, {
    apiVersion: "2022-08-01",
});

const paymentRouter = express.Router();

// Guard all api with authentication
paymentRouter.use((req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    const r: T.APIResponse = { ok: false, error: "401 Unauthorized" };
    return res.status(401).send(r);
});

paymentRouter.post("/create-checkout-session", async (req, res, next) => {
    console.log("with key", env.stripeSecretKey);
    try {
        const prices = await stripe.prices.list({
            lookup_keys: [req.body.lookup_key],
            expand: ['data.product'],
        });
        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: prices.data[0].id,
                    // For metered billing, do not pass quantity
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            // TODO ADD URLS
            success_url: `https://account.lingdocs.com/user?upgrade=success`,
            cancel_url: `https://account.lingdocs.com/user`,
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

paymentRouter.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    (request, response) => {
      let event = request.body;
      // Replace this endpoint secret with your endpoint's unique secret
      // If you are testing with the CLI, find the secret by running 'stripe listen'
      // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
      // at https://dashboard.stripe.com/webhooks
      const endpointSecret = 'whsec_12345';
      // Only verify the event if you have an endpoint secret defined.
      // Otherwise use the basic event deserialized with JSON.parse
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
      let subscription;
      let status;
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.trial_will_end':
          subscription = event.data.object;
          status = subscription.status;
          console.log(`Subscription status is ${status}.`);
          // Then define and call a method to handle the subscription trial ending.
          // handleSubscriptionTrialEnding(subscription);
          break;
        case 'customer.subscription.deleted':
          subscription = event.data.object;
          status = subscription.status;
          console.log(`Subscription status is ${status}.`);
          // Then define and call a method to handle the subscription deleted.
          // handleSubscriptionDeleted(subscriptionDeleted);
          break;
        case 'customer.subscription.created':
          subscription = event.data.object;
          status = subscription.status;
          console.log(`Subscription status is ${status}.`);
          // Then define and call a method to handle the subscription created.
          // handleSubscriptionCreated(subscription);
          break;
        case 'customer.subscription.updated':
          subscription = event.data.object;
          status = subscription.status;
          console.log(`Subscription status is ${status}.`);
          // Then define and call a method to handle the subscription update.
          // handleSubscriptionUpdated(subscription);
          break;
        default:
          // Unexpected event type
          console.log(`Unhandled event type ${event.type}.`);
      }
      // Return a 200 response to acknowledge receipt of the event
      response.send();
    }
);

export default paymentRouter;