import * as SecureStore from 'expo-secure-store';
import { sampleProducts, type Product } from './sample-products';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? 'http://localhost:4000/api/v1' : 'https://exclusives-api.onrender.com/api/v1');
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message ?? 'Request failed');
  return body.data as T;
}
export async function getProducts(query = ''): Promise<Product[]> {
  try { return await api<Product[]>(`/products${query}`); } catch (error) { if (__DEV__) return sampleProducts; throw error; }
}
export async function getProduct(slug: string): Promise<Product> {
  try { return await api<Product>(`/products/${slug}`); } catch (error) { if (!__DEV__) throw error; const p = sampleProducts.find((item) => item.slug === slug) ?? sampleProducts[0]!; return { ...p, description: `${p.name} in ${p.colour}. Authenticated premium stock selected for Exclusives for You.`, images: [p.imageUrl], variants: p.availableSizes.map((size, i) => ({ id: `${p.id}-${size}`, size, sku: `${p.id}-${size}`, stock: i === 2 ? 0 : 3 })) }; }
}
