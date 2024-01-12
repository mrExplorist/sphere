import Stripe from 'stripe';
import { Price, Product } from '../supabase/supabase.types';
import db from '../supabase/db';
import { customers, prices, products, users } from '../../../migrations/schema';
import { stripe } from './index';
import { eq } from 'drizzle-orm';
export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };
  try {
    await db.insert(products).values(productData).onConflictDoUpdate({ target: products.id, set: productData });
  } catch (error) {
    throw new Error();
  }
  console.log('Product inserted/updates:', product.id);
};

// upsertprice record

export const upsertPriceRecord = async (price: Stripe.Price) => {
  console.log(price, 'PRICE');
  const priceData: Price = {
    id: price.id,
    productId: typeof price.product === 'string' ? price.product : null,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unitAmount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    intervalCount: price.recurring?.interval_count ?? null,
    trialPeriodDays: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };
  try {
    await db.insert(prices).values(priceData).onConflictDoUpdate({ target: prices.id, set: priceData });
  } catch (error) {
    throw new Error(`Could not insert/update the price ${error}`);
  }
  console.log(`Price inserted/updated: ${price.id}`);
};

// create or retrieve customer
export const createOrRetrieveCustomer = async ({ email, uuid }: { email: string; uuid: string }) => {
  try {
    const response = await db.query.customers.findFirst({
      where: (c, { eq }) => eq(c.id, uuid),
    });
    if (!response) throw new Error();
    return response.stripeCustomerId;
  } catch (error) {
    const customerData: { metadata: { supabaseUUID: string }; email?: string } = {
      metadata: {
        supabaseUUID: uuid,
      },
    };
    if (email) customerData.email = email;
    try {
      const customer = await stripe.customers.create(customerData);
      await db.insert(customers).values({ id: uuid, stripeCustomerId: customer.id });
      console.log(`New customer created and inserted for ${uuid}.`);
      return customer.id;
    } catch (stripeError) {
      throw new Error('Could not create Customer or find the customer');
    }
  }
};

export const copyBillingDetailsToCustomer = async (uuid: string, payment_method: Stripe.PaymentMethod) => {
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  //@ts-ignore
  await stripe.customers.update(customer, { name, phone, address });
  try {
    await db
      .update(users)
      .set({
        billingAddress: { ...address },
        paymentMethod: { ...payment_method[payment_method.type] },
      })
      .where(eq(users.id, uuid));
  } catch (error) {
    throw new Error('Couldnot copy customer billing details');
  }
};
