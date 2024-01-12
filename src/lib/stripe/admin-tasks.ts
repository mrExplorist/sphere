import Stripe from 'stripe';
import { Price, Product } from '../supabase/supabase.types';
import db from '../supabase/db';
import { prices, products } from '../../../migrations/schema';

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
