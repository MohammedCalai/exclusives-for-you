import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api, uploadProductImage } from './api';

type Metrics = { views: number; saves: number; basketUnits: number; orderedUnits: number; revenuePence: number };
type Variant = { id: string; size: string; sku: string; inventory?: { quantity: number } };
type Product = { id: string; name: string; slug: string; description: string; colour: string; pricePence: number; retailPricePence?: number; status: string; featured: boolean; brand: { name: string }; category: { name: string }; images: Array<{ id: string; url: string; altText: string }>; variants: Variant[]; metrics: Metrics };
type Stats = { products: number; activeProducts: number; totalStock: number; lowStock: number; orders: number; revenuePence: number; customers: number; openMessages: number; pendingOffers: number; views: number; saves: number; basketUnits: number };
type Order = { id: string; orderNumber: string; status: string; totalPence: number; subtotalPence: number; deliveryPence: number; createdAt: string; deliveryAddress?: Record<string, string>; user: { id: string; email: string; firstName?: string; lastName?: string }; items: Array<{ id: string; productName: string; brandName: string; size: string; quantity: number; totalPricePence: number }> };
type ThreadSummary = { id: string; subject: string; status: string; updatedAt: string; user: { email: string; firstName?: string; lastName?: string }; messages: Array<{ body: string; senderType: string; createdAt: string }> };
type Thread = Omit<ThreadSummary, 'messages'> & { messages: Array<{ id: string; body: string; senderType: string; createdAt: string; sender?: { firstName?: string; lastName?: string } }> };
type Offer = { id: string; offerNumber: string; amountPence: number; status: string; message?: string; createdAt: string; user: { email: string; firstName?: string; lastName?: string }; product: { name: string; slug: string }; variant?: { size: string } };
type Customer = { id: string; email: string; firstName?: string; lastName?: string; role: string; emailVerifiedAt?: string; createdAt: string };
type View = 'overview' | 'products' | 'new' | 'orders' | 'messages' | 'offers' | 'customers';
type FormState = { name: string; slug: string; description: string; brandName: string; categoryName: string; colour: string; baseSku: string; price: string; retailPrice: string; sizes: string; quantity: string; featured: boolean };

const emptyForm: FormState = { name: '', slug: '', description: '', brandName: '', categoryName: 'Trainers', colour: '', baseSku: '', price: '', retailPrice: '', sizes: '', quantity: '1', featured: true };
const money = (pence = 0) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
const shortDate = (date: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const nameOf = (person?: { firstName?: string; lastName?: string; email: string }) => [person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.email || 'Customer';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api<{ accessToken: string; user: { role: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (result.user.role !== 'ADMIN') throw new Error('This account does not have seller access');
      sessionStorage.setItem('adminAccessToken', result.accessToken); onLogin();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to sign in'); }
    finally { setBusy(false); }
  };
  return <main className="login-shell">
    <section className="login-story"><div className="brand-lockup"><span className="brand-mark">X</span><span>XCLUSIVEZ<br />4 YOU</span></div><div><p className="eyebrow">SELLER STUDIO</p><h1>Run the<br />whole store.</h1><p>Products, stock, orders and customer conversations in one place.</p></div><p className="secure-note">Protected seller access</p></section>
    <section className="login-panel"><form onSubmit={submit} className="login-form"><p className="eyebrow">WELCOME BACK</p><h2>Studio sign in</h2><p className="subtle">Use your administrator account.</p><Field label="Email address"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></Field><Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></Field>{error ? <div className="error">{error}</div> : null}<button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Open studio'}</button></form></section>
  </main>;
}

function Status({ value }: { value: string }) { return <span className={`status status-${value.toLowerCase().replace('_', '-')}`}>{value.replaceAll('_', ' ')}</span>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="empty">{children}</div>; }

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<View>('overview');
  const [stats, setStats] = useState<Stats>();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [preview, setPreview] = useState<Product>();
  const [selectedOrder, setSelectedOrder] = useState<Order>();
  const [selectedThread, setSelectedThread] = useState<Thread>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setError('');
    try {
      const [nextStats, nextProducts, nextOrders, nextThreads, nextOffers, nextCustomers] = await Promise.all([
        api<Stats>('/admin/dashboard'), api<Product[]>('/admin/products'), api<Order[]>('/admin/orders'), api<ThreadSummary[]>('/support/admin/threads'), api<Offer[]>('/admin/offers'), api<Customer[]>('/admin/users'),
      ]);
      setStats(nextStats); setProducts(nextProducts); setOrders(nextOrders); setThreads(nextThreads); setOffers(nextOffers); setCustomers(nextCustomers);
      setSelectedOrder((current) => current ? nextOrders.find((item) => item.id === current.id) : current);
    } catch (reason) { if (!quiet) setError(reason instanceof Error ? reason.message : 'Could not refresh the studio'); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(true), 30000); return () => window.clearInterval(timer); }, [load]);

  const act = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true); setError(''); setNotice('');
    try { await work(); setNotice(success); await load(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Something went wrong'); }
    finally { setBusy(false); }
  };
  const openThread = async (id: string) => { setSelectedThread(await api<Thread>(`/support/threads/${id}`)); setMessage(''); };
  const nav: Array<{ id: View; label: string; badge?: number }> = [
    { id: 'overview', label: 'Overview' }, { id: 'products', label: 'Products' }, { id: 'new', label: 'Add product' },
    { id: 'orders', label: 'Orders', badge: orders.filter((o) => ['PAID', 'PROCESSING'].includes(o.status)).length },
    { id: 'messages', label: 'Messages', badge: stats?.openMessages }, { id: 'offers', label: 'Offers', badge: stats?.pendingOffers }, { id: 'customers', label: 'Customers' },
  ];
  const titles: Record<View, [string, string]> = { overview: ['TODAY IN THE STUDIO', 'Overview'], products: ['CATALOGUE', 'Products'], new: ['NEW LISTING', 'Add a product'], orders: ['FULFILMENT', 'Orders'], messages: ['CUSTOMER CARE', 'Messages'], offers: ['NEGOTIATIONS', 'Offers'], customers: ['AUDIENCE', 'Customers'] };

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand-lockup dark"><span className="brand-mark">X</span><span>XCLUSIVEZ<br />STUDIO</span></div><nav>{nav.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><span>{item.label}</span>{item.badge ? <b>{item.badge}</b> : null}</button>)}</nav><div className="live-dot"><i /> Live data refreshes automatically</div><button className="logout" onClick={onLogout}>Sign out</button></aside>
    <main className="workspace"><header><div><p className="eyebrow">{titles[view][0]}</p><h1>{titles[view][1]}</h1></div><div className="header-actions"><button className="secondary" onClick={() => void load()} disabled={busy}>Refresh</button>{view !== 'new' ? <button className="primary compact" onClick={() => setView('new')}>+ Add product</button> : null}</div></header>
      {error ? <div className="banner error"><span>{error}</span><button onClick={() => setError('')}>×</button></div> : null}{notice ? <div className="banner success"><span>{notice}</span><button onClick={() => setNotice('')}>×</button></div> : null}
      {view === 'overview' ? <Overview stats={stats} orders={orders} products={products} threads={threads} offers={offers} go={setView} selectOrder={(order) => { setSelectedOrder(order); setView('orders'); }} /> : null}
      {view === 'products' ? <Products products={products} onPreview={setPreview} onToggle={(product) => void act(() => api(`/admin/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ status: product.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' }) }), product.status === 'ACTIVE' ? 'Listing hidden from the app.' : 'Listing is now live in the app.')} onStock={(variantId, quantity, productId) => void act(() => api(`/admin/products/${productId}/stock`, { method: 'PATCH', body: JSON.stringify({ variantId, quantity }) }), 'Stock updated.')} /> : null}
      {view === 'new' ? <ProductForm afterPublish={() => { void load(true); setView('products'); setNotice('Product published and live in the app.'); }} /> : null}
      {view === 'orders' ? <Orders orders={orders} selected={selectedOrder} onSelect={setSelectedOrder} message={message} setMessage={setMessage} busy={busy} onStatus={(order, status) => void act(() => api(`/admin/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }), 'Order status updated.')} onMessage={(order) => void act(async () => { await api(`/admin/orders/${order.id}/message`, { method: 'POST', body: JSON.stringify({ body: message }) }); setMessage(''); }, 'Message sent to the customer.')} /> : null}
      {view === 'messages' ? <Messages threads={threads} selected={selectedThread} onOpen={(id) => void openThread(id)} message={message} setMessage={setMessage} busy={busy} onReply={(thread) => void act(async () => { const result = await api<Thread>(`/support/threads/${thread.id}/messages`, { method: 'POST', body: JSON.stringify({ body: message }) }); setSelectedThread(result); setMessage(''); }, 'Reply sent and the customer was notified.')} onStatus={(thread, status) => void act(async () => { await api(`/support/admin/threads/${thread.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); setSelectedThread({ ...thread, status }); }, `Conversation ${status === 'CLOSED' ? 'closed' : 'reopened'}.`)} /> : null}
      {view === 'offers' ? <Offers offers={offers} busy={busy} onDecision={(offer, status) => void act(() => api(`/admin/offers/${offer.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }), `Offer ${status.toLowerCase()}.`)} /> : null}
      {view === 'customers' ? <Customers customers={customers} orders={orders} /> : null}
    </main>
    {preview ? <Preview product={preview} onClose={() => setPreview(undefined)} /> : null}
  </div>;
}

function Overview({ stats, orders, products, threads, offers, go, selectOrder }: { stats?: Stats; orders: Order[]; products: Product[]; threads: ThreadSummary[]; offers: Offer[]; go: (view: View) => void; selectOrder: (order: Order) => void }) {
  const top = [...products].sort((a, b) => b.metrics.views - a.metrics.views).slice(0, 5);
  const cards = [{ label: 'Revenue', value: money(stats?.revenuePence), note: `${stats?.orders ?? 0} total orders` }, { label: 'Product views', value: stats?.views ?? 0, note: `${stats?.saves ?? 0} saved` }, { label: 'In baskets', value: stats?.basketUnits ?? 0, note: 'Live basket units' }, { label: 'Stock', value: stats?.totalStock ?? 0, note: `${stats?.lowStock ?? 0} low-stock sizes` }];
  return <div className="stack"><section className="metrics">{cards.map((card) => <article className="metric" key={card.label}><span>{card.label}</span><strong>{card.value}</strong><small>{card.note}</small></article>)}</section>
    <section className="attention"><div><p className="eyebrow">NEEDS ATTENTION</p><h2>Keep the shop moving</h2></div><button onClick={() => go('orders')}><strong>{orders.filter((o) => ['PAID', 'PROCESSING'].includes(o.status)).length}</strong><span>Orders to fulfil</span></button><button onClick={() => go('messages')}><strong>{threads.filter((t) => t.status === 'OPEN').length}</strong><span>Open messages</span></button><button onClick={() => go('offers')}><strong>{offers.filter((o) => o.status === 'PENDING').length}</strong><span>Offers waiting</span></button></section>
    <div className="two-columns"><section className="card"><div className="card-head"><div><p className="eyebrow">LATEST</p><h2>Recent orders</h2></div><button className="text-button" onClick={() => go('orders')}>View all</button></div>{orders.slice(0, 5).map((order) => <button className="row-button" key={order.id} onClick={() => selectOrder(order)}><span><b>{order.orderNumber}</b><small>{nameOf(order.user)} · {shortDate(order.createdAt)}</small></span><span><Status value={order.status} /><b>{money(order.totalPence)}</b></span></button>)}{!orders.length ? <Empty>No orders yet.</Empty> : null}</section>
      <section className="card"><div className="card-head"><div><p className="eyebrow">DISCOVERY</p><h2>Top listings</h2></div><button className="text-button" onClick={() => go('products')}>Products</button></div>{top.map((product, index) => <div className="rank-row" key={product.id}><b>0{index + 1}</b><img src={product.images[0]?.url} alt="" /><span><strong>{product.name}</strong><small>{product.metrics.views} views · {product.metrics.saves} saves</small></span><em>{money(product.metrics.revenuePence)}</em></div>)}{!top.length ? <Empty>Add a product to see performance.</Empty> : null}</section></div>
  </div>;
}

function Products({ products, onPreview, onToggle, onStock }: { products: Product[]; onPreview: (product: Product) => void; onToggle: (product: Product) => void; onStock: (variantId: string, quantity: number, productId: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = products.filter((p) => `${p.brand.name} ${p.name} ${p.colour}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="card table-card"><div className="toolbar"><input className="search" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} /><span>{filtered.length} listings</span></div><div className="product-table"><div className="table-row table-head"><span>Listing</span><span>Stock</span><span>Views</span><span>Saved</span><span>Basket</span><span>Sold</span><span>Revenue</span><span /></div>{filtered.map((product) => { const stock = product.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0); return <div className="table-row" key={product.id}><span className="product-cell"><img src={product.images[0]?.url} alt="" /><span><b>{product.name}</b><small>{product.brand.name} · {money(product.pricePence)}</small><Status value={product.status} /></span></span><span><b>{stock}</b><small>{product.variants.length} sizes</small></span><span>{product.metrics.views}</span><span>{product.metrics.saves}</span><span>{product.metrics.basketUnits}</span><span>{product.metrics.orderedUnits}</span><span>{money(product.metrics.revenuePence)}</span><span className="table-actions"><button onClick={() => onPreview(product)}>Preview</button><button onClick={() => onToggle(product)}>{product.status === 'ACTIVE' ? 'Hide' : 'Publish'}</button></span><div className="stock-strip">{product.variants.map((variant) => <label key={variant.id}>UK {variant.size}<input type="number" min="0" defaultValue={variant.inventory?.quantity ?? 0} onBlur={(e) => { const next = Number(e.target.value); if (next !== (variant.inventory?.quantity ?? 0)) onStock(variant.id, next, product.id); }} /></label>)}</div></div>; })}</div>{!filtered.length ? <Empty>No matching products.</Empty> : null}</section>;
}

function ProductForm({ afterPublish }: { afterPublish: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm); const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);
  const update = (key: keyof FormState, value: string | boolean) => setForm((current) => ({ ...current, [key]: value, ...(key === 'name' && (!current.slug || current.slug === slugify(current.name)) ? { slug: slugify(String(value)) } : {}) }));
  const pickFiles = (event: ChangeEvent<HTMLInputElement>) => { setFiles((current) => [...current, ...Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'))].slice(0, 8)); event.target.value = ''; };
  const publish = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!files.length) throw new Error('Add at least one product photo');
      const product = await api<{ id: string }>('/admin/products', { method: 'POST', body: JSON.stringify({ name: form.name, slug: form.slug, description: form.description, brandName: form.brandName, categoryName: form.categoryName, colour: form.colour, baseSku: form.baseSku.toUpperCase(), pricePence: Math.round(Number(form.price) * 100), ...(form.retailPrice ? { retailPricePence: Math.round(Number(form.retailPrice) * 100) } : {}), featured: form.featured, status: 'DRAFT' }) });
      for (const [index, file] of files.entries()) { const uploaded = await uploadProductImage(file); await api(`/admin/products/${product.id}/images`, { method: 'POST', body: JSON.stringify({ url: uploaded.publicUrl, storageKey: uploaded.key, altText: `${form.name} product image ${index + 1}` }) }); }
      for (const size of form.sizes.split(',').map((value) => value.trim()).filter(Boolean)) await api(`/admin/products/${product.id}/variants`, { method: 'POST', body: JSON.stringify({ size, sku: `${form.baseSku}-${size}`.replace(/\s+/g, '-').toUpperCase(), quantity: Number(form.quantity) }) });
      await api(`/admin/products/${product.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'ACTIVE' }) }); setForm(emptyForm); setFiles([]); afterPublish();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not publish product'); } finally { setBusy(false); }
  };
  return <form className="product-form" onSubmit={publish}><section className="form-card"><p className="step">01 · PRODUCT</p><h2>What are you listing?</h2><div className="form-grid"><Field label="Product name"><input required value={form.name} onChange={(e) => update('name', e.target.value)} /></Field><Field label="Brand"><input required value={form.brandName} onChange={(e) => update('brandName', e.target.value)} /></Field><Field label="Category"><select value={form.categoryName} onChange={(e) => update('categoryName', e.target.value)}><option>Trainers</option><option>Clothing</option><option>Accessories</option></select></Field><Field label="Colour"><input required value={form.colour} onChange={(e) => update('colour', e.target.value)} /></Field><Field label="Description"><textarea rows={5} required value={form.description} onChange={(e) => update('description', e.target.value)} /></Field><Field label="App link" hint="Created automatically from the name"><input required value={form.slug} onChange={(e) => update('slug', e.target.value)} /></Field></div></section>
    <section className="form-card"><p className="step">02 · PHOTOS</p><h2>Show every angle</h2><label className="dropzone"><input type="file" accept="image/*" multiple onChange={pickFiles} /><strong>Choose product photos</strong><span>Up to 8 images · first image is the cover</span></label><div className="preview-grid">{previews.map((item, index) => <figure key={item.url}><img src={item.url} alt="" /><figcaption>{index === 0 ? 'Cover' : index + 1}<button type="button" onClick={() => setFiles((all) => all.filter((file) => file !== item.file))}>Remove</button></figcaption></figure>)}</div></section>
    <section className="form-card"><p className="step">03 · PRICE & STOCK</p><h2>Set availability</h2><div className="form-grid three"><Field label="Selling price (£)"><input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} /></Field><Field label="Original retail price (£)"><input type="number" min="0" step="0.01" value={form.retailPrice} onChange={(e) => update('retailPrice', e.target.value)} /></Field><Field label="Base SKU"><input required value={form.baseSku} onChange={(e) => update('baseSku', e.target.value)} placeholder="NIKE-AJ1-BRED" /></Field><Field label="Sizes" hint="Separate sizes with commas"><input required value={form.sizes} onChange={(e) => update('sizes', e.target.value)} placeholder="6, 7, 8, 9" /></Field><Field label="Quantity per size"><input required type="number" min="0" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} /></Field><label className="check"><input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} /><span><b>Feature on home</b><small>Give this listing extra visibility.</small></span></label></div></section>{error ? <div className="error">{error}</div> : null}<div className="publish-bar"><span>The item becomes visible in the app immediately.</span><button className="primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish product'}</button></div></form>;
}

function Orders({ orders, selected, onSelect, message, setMessage, busy, onStatus, onMessage }: { orders: Order[]; selected?: Order; onSelect: (order: Order) => void; message: string; setMessage: (value: string) => void; busy: boolean; onStatus: (order: Order, status: string) => void; onMessage: (order: Order) => void }) {
  return <div className="split-view"><section className="card list-panel"><div className="card-head"><h2>All orders</h2><span>{orders.length}</span></div>{orders.map((order) => <button className={selected?.id === order.id ? 'list-item selected' : 'list-item'} key={order.id} onClick={() => onSelect(order)}><span><b>{order.orderNumber}</b><small>{nameOf(order.user)} · {shortDate(order.createdAt)}</small></span><span><Status value={order.status} /><strong>{money(order.totalPence)}</strong></span></button>)}{!orders.length ? <Empty>No orders yet.</Empty> : null}</section>
    <section className="card detail-panel">{selected ? <><div className="detail-title"><div><p className="eyebrow">{selected.orderNumber}</p><h2>{nameOf(selected.user)}</h2><small>{selected.user.email}</small></div><Status value={selected.status} /></div><Field label="Order status"><select value={selected.status} onChange={(e) => onStatus(selected, e.target.value)}><option>PENDING_PAYMENT</option><option>PAID</option><option>PROCESSING</option><option>DISPATCHED</option><option>DELIVERED</option><option>CANCELLED</option><option>REFUNDED</option></select></Field><div className="order-lines">{selected.items.map((item) => <div key={item.id}><span><b>{item.productName}</b><small>{item.brandName} · UK {item.size} · Qty {item.quantity}</small></span><strong>{money(item.totalPricePence)}</strong></div>)}</div><div className="total"><span>Total</span><strong>{money(selected.totalPence)}</strong></div>{selected.deliveryAddress ? <div className="address"><b>Deliver to</b><span>{selected.deliveryAddress.fullName}<br />{selected.deliveryAddress.line1}<br />{selected.deliveryAddress.line2 ? <>{selected.deliveryAddress.line2}<br /></> : null}{selected.deliveryAddress.city}, {selected.deliveryAddress.postcode}</span></div> : null}<div className="composer"><b>Message this customer</b><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your order is packed and ready…" /><button className="primary" disabled={busy || message.trim().length < 2} onClick={() => onMessage(selected)}>Send update</button><small>Saved in Messages and sent as a notification.</small></div></> : <Empty>Select an order to see details and contact the customer.</Empty>}</section>
  </div>;
}

function Messages({ threads, selected, onOpen, message, setMessage, busy, onReply, onStatus }: { threads: ThreadSummary[]; selected?: Thread; onOpen: (id: string) => void; message: string; setMessage: (value: string) => void; busy: boolean; onReply: (thread: Thread) => void; onStatus: (thread: Thread, status: string) => void }) {
  return <div className="split-view"><section className="card list-panel"><div className="card-head"><h2>Inbox</h2><span>{threads.filter((t) => t.status === 'OPEN').length} open</span></div>{threads.map((thread) => <button className={selected?.id === thread.id ? 'list-item selected' : 'list-item'} key={thread.id} onClick={() => onOpen(thread.id)}><span><b>{thread.subject}</b><small>{nameOf(thread.user)} · {thread.messages[0]?.body ?? 'No messages'}</small></span><Status value={thread.status} /></button>)}{!threads.length ? <Empty>Your inbox is clear.</Empty> : null}</section>
    <section className="card conversation">{selected ? <><div className="detail-title"><div><p className="eyebrow">CONVERSATION</p><h2>{selected.subject}</h2><small>{nameOf(selected.user)} · {selected.user.email}</small></div><button className="secondary" onClick={() => onStatus(selected, selected.status === 'OPEN' ? 'CLOSED' : 'OPEN')}>{selected.status === 'OPEN' ? 'Close' : 'Reopen'}</button></div><div className="messages">{selected.messages.map((item) => <div className={item.senderType === 'ADMIN' ? 'message admin' : 'message customer'} key={item.id}><b>{item.senderType === 'ADMIN' ? 'Studio' : nameOf(selected.user)}</b><p>{item.body}</p><small>{shortDate(item.createdAt)}</small></div>)}</div><div className="composer"><textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a helpful reply…" /><button className="primary" disabled={busy || message.trim().length < 2} onClick={() => onReply(selected)}>Reply & notify</button></div></> : <Empty>Select a conversation to read and reply.</Empty>}</section></div>;
}

function Offers({ offers, busy, onDecision }: { offers: Offer[]; busy: boolean; onDecision: (offer: Offer, status: string) => void }) { return <section className="offers-grid">{offers.map((offer) => <article className="offer-card" key={offer.id}><div><p className="eyebrow">{offer.offerNumber}</p><Status value={offer.status} /></div><h2>{money(offer.amountPence)}</h2><p><b>{offer.product.name}</b>{offer.variant ? ` · UK ${offer.variant.size}` : ''}</p><small>From {nameOf(offer.user)} · {shortDate(offer.createdAt)}</small>{offer.message ? <blockquote>“{offer.message}”</blockquote> : null}{offer.status === 'PENDING' ? <footer><button disabled={busy} className="secondary" onClick={() => onDecision(offer, 'REJECTED')}>Decline</button><button disabled={busy} className="primary" onClick={() => onDecision(offer, 'ACCEPTED')}>Accept offer</button></footer> : null}</article>)}{!offers.length ? <Empty>No offers have been made yet.</Empty> : null}</section>; }

function Customers({ customers, orders }: { customers: Customer[]; orders: Order[] }) { const customerOrders = (id: string) => orders.filter((order) => order.user.id === id); return <section className="card customer-list"><div className="table-row customer-head"><span>Customer</span><span>Joined</span><span>Orders</span><span>Spend</span><span>Account</span></div>{customers.filter((user) => user.role === 'CUSTOMER').map((customer) => { const owned = customerOrders(customer.id); return <div className="table-row customer-row" key={customer.id}><span><b>{nameOf(customer)}</b><small>{customer.email}</small></span><span>{shortDate(customer.createdAt)}</span><span>{owned.length}</span><span>{money(owned.reduce((sum, order) => sum + (['CANCELLED', 'REFUNDED'].includes(order.status) ? 0 : order.totalPence), 0))}</span><span>{customer.emailVerifiedAt ? 'Verified' : 'Unverified'}</span></div>; })}</section>; }

function Preview({ product, onClose }: { product: Product; onClose: () => void }) { return <div className="modal-shade" onMouseDown={onClose}><aside className="preview-drawer" onMouseDown={(e) => e.stopPropagation()}><header><div><p className="eyebrow">LIVE APP PREVIEW</p><h2>{product.name}</h2></div><button onClick={onClose}>×</button></header><div className="phone-preview"><img src={product.images[0]?.url} alt={product.name} /><div><p className="brand-name">{product.brand.name}</p><h3>{product.name}</h3><span>{product.colour}</span><strong>{money(product.pricePence)}</strong><p className="size-title">Select size</p><div className="sizes">{product.variants.map((variant) => <span key={variant.id}>{variant.size}</span>)}</div><button>Add to basket</button><p className="description">{product.description}</p></div></div><section className="preview-metrics"><div><b>{product.metrics.views}</b><span>views</span></div><div><b>{product.metrics.saves}</b><span>saves</span></div><div><b>{product.metrics.basketUnits}</b><span>in baskets</span></div><div><b>{product.metrics.orderedUnits}</b><span>sold</span></div></section></aside></div>; }

export function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(sessionStorage.getItem('adminAccessToken')));
  return loggedIn ? <Dashboard onLogout={() => { sessionStorage.removeItem('adminAccessToken'); setLoggedIn(false); }} /> : <Login onLogin={() => setLoggedIn(true)} />;
}

export default App;
