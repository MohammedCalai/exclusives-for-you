import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, uploadProductImage } from './api';

type ProductImage = { id: string; url: string; altText: string };
type Variant = { id: string; size: string; inventory?: { quantity: number } };
type Product = {
  id: string;
  name: string;
  slug: string;
  colour: string;
  pricePence: number;
  retailPricePence?: number;
  status: string;
  featured: boolean;
  brand: { name: string };
  category: { name: string };
  images: ProductImage[];
  variants: Variant[];
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  brandName: string;
  categoryName: string;
  colour: string;
  baseSku: string;
  price: string;
  retailPrice: string;
  sizes: string;
  quantity: string;
  featured: boolean;
};

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  brandName: '',
  categoryName: 'Trainers',
  colour: '',
  baseSku: '',
  price: '',
  retailPrice: '',
  sizes: '',
  quantity: '1',
  featured: true,
};

const money = (pence: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api<{ accessToken: string; user: { role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.user.role !== 'ADMIN') throw new Error('This account does not have admin access');
      sessionStorage.setItem('adminAccessToken', result.accessToken);
      onLogin();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand-lockup">
          <span className="brand-mark">X</span>
          <span>
            EXCLUSIVES
            <br />
            FOR YOU
          </span>
        </div>
        <div>
          <p className="eyebrow">PRIVATE STUDIO</p>
          <h1>
            Curate the
            <br />
            next drop.
          </h1>
          <p>Publish products, control stock and keep every order moving.</p>
        </div>
        <p className="secure-note">Protected admin access · Activity is permission checked</p>
      </section>
      <section className="login-panel">
        <form onSubmit={submit} className="login-form">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Studio sign in</h2>
          <p className="subtle">Use your separate administrator account.</p>
          <Field label="Email address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          {error ? (
            <div className="error" role="alert">
              {error}
            </div>
          ) : null}
          <button className="primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Open studio'}
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState<'products' | 'new'>('products');

  const load = useCallback(async () => {
    try {
      setProducts(await api<Product[]>('/admin/products'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load products');
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [previews],
  );

  const update = (key: keyof FormState, value: string | boolean) =>
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'name' && (!current.slug || current.slug === slugify(current.name))
        ? { slug: slugify(String(value)) }
        : {}),
    }));

  const pickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith('image/'),
    );
    setFiles((current) => [...current, ...selected].slice(0, 8));
    event.target.value = '';
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const pricePence = Math.round(Number(form.price) * 100);
      const retailPricePence = form.retailPrice
        ? Math.round(Number(form.retailPrice) * 100)
        : undefined;
      const product = await api<{ id: string }>('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          brandName: form.brandName,
          categoryName: form.categoryName,
          colour: form.colour,
          baseSku: form.baseSku.toUpperCase(),
          pricePence,
          retailPricePence,
          featured: form.featured,
          status: 'DRAFT',
        }),
      });
      for (const [index, file] of files.entries()) {
        const uploaded = await uploadProductImage(file);
        await api(`/admin/products/${product.id}/images`, {
          method: 'POST',
          body: JSON.stringify({
            url: uploaded.publicUrl,
            storageKey: uploaded.key,
            altText: `${form.name} product image ${index + 1}`,
          }),
        });
      }
      const sizes = form.sizes
        .split(',')
        .map((size) => size.trim())
        .filter(Boolean);
      for (const size of sizes) {
        await api(`/admin/products/${product.id}/variants`, {
          method: 'POST',
          body: JSON.stringify({
            size,
            sku: `${form.baseSku}-${size}`.replace(/\s+/g, '-').toUpperCase(),
            quantity: Number(form.quantity),
          }),
        });
      }
      await api(`/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      setNotice(`${form.name} is now live in the shop.`);
      setForm(emptyForm);
      setFiles([]);
      setView('products');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not publish this product');
    } finally {
      setBusy(false);
    }
  };

  const stock = products.reduce(
    (sum, product) =>
      sum +
      product.variants.reduce((total, variant) => total + (variant.inventory?.quantity ?? 0), 0),
    0,
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup dark">
          <span className="brand-mark">X</span>
          <span>
            EXCLUSIVES
            <br />
            FOR YOU
          </span>
        </div>
        <nav>
          <button
            className={view === 'products' ? 'active' : ''}
            onClick={() => setView('products')}
          >
            Products
          </button>
          <button className={view === 'new' ? 'active' : ''} onClick={() => setView('new')}>
            Add product
          </button>
        </nav>
        <button className="logout" onClick={onLogout}>
          Sign out
        </button>
      </aside>
      <main className="workspace">
        <header>
          <div>
            <p className="eyebrow">PRIVATE STUDIO</p>
            <h1>{view === 'new' ? 'Add a product' : 'Product catalogue'}</h1>
          </div>
          <button className="primary compact" onClick={() => setView('new')}>
            ＋ New product
          </button>
        </header>
        {error ? (
          <div className="error banner" role="alert">
            {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        ) : null}
        {notice ? (
          <div className="success banner" role="status">
            {notice}
            <button onClick={() => setNotice('')}>×</button>
          </div>
        ) : null}
        {view === 'products' ? (
          <>
            <section className="metrics">
              <article>
                <span>Active products</span>
                <strong>{products.filter((p) => p.status === 'ACTIVE').length}</strong>
              </article>
              <article>
                <span>Total units</span>
                <strong>{stock}</strong>
              </article>
              <article>
                <span>Featured</span>
                <strong>{products.filter((p) => p.featured).length}</strong>
              </article>
            </section>
            <section className="catalogue-card">
              <div className="section-heading">
                <div>
                  <h2>All products</h2>
                  <p>Prices, imagery and available inventory.</p>
                </div>
                <span className="count">{products.length} items</span>
              </div>
              <div className="product-list">
                {products.length ? (
                  products.map((product) => (
                    <article className="product-row" key={product.id}>
                      <div className="thumb">
                        {product.images[0] ? (
                          <img src={product.images[0].url} alt="" />
                        ) : (
                          <span>NO IMAGE</span>
                        )}
                      </div>
                      <div className="product-copy">
                        <strong>{product.name}</strong>
                        <span>
                          {product.brand.name} · {product.category.name} · {product.colour}
                        </span>
                        <small>
                          {product.variants.length} size{product.variants.length === 1 ? '' : 's'} ·{' '}
                          {product.variants.reduce((n, v) => n + (v.inventory?.quantity ?? 0), 0)}{' '}
                          units
                        </small>
                      </div>
                      <div className="price">
                        <strong>{money(product.pricePence)}</strong>
                        {product.retailPricePence ? (
                          <del>{money(product.retailPricePence)}</del>
                        ) : null}
                      </div>
                      <span className={`pill ${product.status.toLowerCase()}`}>
                        {product.status.replaceAll('_', ' ')}
                      </span>
                    </article>
                  ))
                ) : (
                  <div className="empty">
                    <span>◇</span>
                    <h3>Your catalogue is ready.</h3>
                    <p>Add the first item to begin building the shop.</p>
                    <button className="primary compact" onClick={() => setView('new')}>
                      Add first product
                    </button>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <form className="product-form" onSubmit={publish}>
            <section className="form-card">
              <div className="section-heading">
                <div>
                  <p className="step">01</p>
                  <h2>Product details</h2>
                  <p>The information shoppers will see.</p>
                </div>
              </div>
              <div className="form-grid">
                <Field label="Product name">
                  <input
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Web address">
                  <input
                    value={form.slug}
                    onChange={(e) => update('slug', slugify(e.target.value))}
                    required
                  />
                </Field>
                <Field label="Brand">
                  <input
                    value={form.brandName}
                    onChange={(e) => update('brandName', e.target.value)}
                    placeholder="Nike"
                    required
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.categoryName}
                    onChange={(e) => update('categoryName', e.target.value)}
                  >
                    <option>Trainers</option>
                    <option>Clothing</option>
                    <option>Accessories</option>
                  </select>
                </Field>
                <Field label="Colour">
                  <input
                    value={form.colour}
                    onChange={(e) => update('colour', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Base SKU">
                  <input
                    value={form.baseSku}
                    onChange={(e) => update('baseSku', e.target.value)}
                    placeholder="NK-AM95-BLK"
                    required
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={5}
                    required
                  />
                </Field>
              </div>
            </section>
            <section className="form-card">
              <div className="section-heading">
                <div>
                  <p className="step">02</p>
                  <h2>Photography</h2>
                  <p>Upload up to eight JPEG, PNG, WebP or AVIF images.</p>
                </div>
                <span className="count">{files.length}/8</span>
              </div>
              <label className="dropzone">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  onChange={pickFiles}
                />
                <span className="upload-icon">↑</span>
                <strong>Choose product images</strong>
                <small>Maximum 10 MB per image</small>
              </label>
              {previews.length ? (
                <div className="previews">
                  {previews.map(({ file, url }, index) => (
                    <div className="preview" key={`${file.name}-${index}`}>
                      <img src={url} alt="" />
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
            <section className="form-card">
              <div className="section-heading">
                <div>
                  <p className="step">03</p>
                  <h2>Price and inventory</h2>
                  <p>Amounts are shown to customers in pounds.</p>
                </div>
              </div>
              <div className="form-grid thirds">
                <Field label="Selling price">
                  <div className="money-input">
                    <span>£</span>
                    <input
                      inputMode="decimal"
                      value={form.price}
                      onChange={(e) => update('price', e.target.value)}
                      placeholder="129.99"
                      required
                    />
                  </div>
                </Field>
                <Field label="Original price">
                  <div className="money-input">
                    <span>£</span>
                    <input
                      inputMode="decimal"
                      value={form.retailPrice}
                      onChange={(e) => update('retailPrice', e.target.value)}
                      placeholder="174.99"
                    />
                  </div>
                </Field>
                <Field label="Quantity per size">
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => update('quantity', e.target.value)}
                    required
                  />
                </Field>
                <Field label="Sizes" hint="Separate sizes with commas">
                  <input
                    value={form.sizes}
                    onChange={(e) => update('sizes', e.target.value)}
                    placeholder="7, 8, 9, 10"
                    required
                  />
                </Field>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => update('featured', e.target.checked)}
                  />
                  <span>
                    <strong>Feature this product</strong>
                    <small>Show it prominently in the customer app.</small>
                  </span>
                </label>
              </div>
            </section>
            <div className="publish-bar">
              <div>
                <strong>Ready to publish?</strong>
                <span>The product becomes visible immediately.</span>
              </div>
              <button type="submit" className="primary" disabled={busy || files.length === 0}>
                {busy ? 'Uploading and publishing…' : 'Publish product'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export function App() {
  const [authenticated, setAuthenticated] = useState(
    Boolean(sessionStorage.getItem('adminAccessToken')),
  );
  const logout = () => {
    sessionStorage.removeItem('adminAccessToken');
    setAuthenticated(false);
  };
  return authenticated ? (
    <Dashboard onLogout={logout} />
  ) : (
    <Login onLogin={() => setAuthenticated(true)} />
  );
}
