import Stripe from 'stripe';
import { Product } from '../supabase/supabase.types';
import db from '../supabase/db';
import { products } from '../../../migrations/schema';

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
