import { create } from 'zustand';
import type { Product } from './sample-products';
import { api } from './api';
type BasketItem = { product: Product; size: string; variantId: string; quantity: number };
type Store = { favourites: string[]; basket: BasketItem[]; toggleFavourite: (id: string) => void; addToBasket: (product: Product, size: string, variantId: string) => void; setQuantity: (variantId: string, quantity: number) => void; clearBasket: () => void };
export const useShop = create<Store>((set) => ({
  favourites: [], basket: [],
  toggleFavourite: (id) => set((s) => {
    const isSaved = s.favourites.includes(id);
    void api(isSaved ? `/favourites/${id}` : '/favourites', {
      method: isSaved ? 'DELETE' : 'POST',
      ...(isSaved ? {} : { body: JSON.stringify({ productId: id }) }),
    }).catch(() => undefined);
    return { favourites: isSaved ? s.favourites.filter((v) => v !== id) : [...s.favourites, id] };
  }),
  addToBasket: (product, size, variantId) => set((s) => {
    void api('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ variantId, quantity: 1 }),
    }).catch(() => undefined);
    const found = s.basket.find((i) => i.variantId === variantId);
    return { basket: found ? s.basket.map((i) => i.variantId === variantId ? { ...i, quantity: i.quantity + 1 } : i) : [...s.basket, { product, size, variantId, quantity: 1 }] };
  }),
  setQuantity: (variantId, quantity) => set((s) => ({ basket: quantity < 1 ? s.basket.filter((i) => i.variantId !== variantId) : s.basket.map((i) => i.variantId === variantId ? { ...i, quantity } : i) })),
  clearBasket: () => set({ basket: [] }),
}));
