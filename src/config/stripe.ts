import Stripe from "stripe";
import config from ".";

    const stripe = new Stripe(config.stripe.secret_key as string, {
        apiVersion: '2025-08-27.basil',
        typescript: true,
    });

    export default stripe;