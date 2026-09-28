# Ordering, booking and quotes over WhatsApp

Small businesses here run on WhatsApp, not payment gateways. So the site does the part a gateway would (it builds a clean, priced, validated order) and hands it off as a pre-written WhatsApp message to the business number. The customer only has to press send.

## Contents
1. Data and config layout
2. Cart model (restaurants and shops)
3. Checkout drawer
4. The WhatsApp message
5. Variants by business type
6. Opening hours and time-limited deals
7. Pakistani market defaults

## 1. Data and config layout

- `js/config.js` → `window.SITE_CONFIG.business` holds the business settings:
  - name, `whatsapp` (international format, no `+`), `phoneDisplay`, `address`, `timezone`;
  - hours, minimum order, free-delivery threshold and delivery zones.
- `js/data.js` holds the content arrays, so a client's changes never touch the logic:
  - catalogue items (`id`, `cat`, `name`, `desc`, `img?`, `price` or `sizes[]`, `addons[]?`, `spice?`, `tags[]?`);
  - categories, deals, gallery and reviews.
- `js/app.js` renders from those arrays. Escape every string you put into `innerHTML` (`esc()` helper).

## 2. Cart model

```js
// line = { kind: 'item'|'deal', id, size: index|null, spice: index|null, addons: [ids], note: '', qty }
const keyOf = (l) => [l.kind, l.id, l.size, l.spice, (l.addons || []).slice().sort().join(','), l.note || ''].join('|');
function addLine(l, qty = 1) {
  const hit = state.lines.find((x) => keyOf(x) === keyOf(l));
  if (hit) hit.qty += qty; else state.lines.push({ ...l, qty });
  save(); renderCart(); bump();
}
function unitPrice(l) {
  if (l.kind === 'deal') return dealById[l.id].price;
  const it = itemById[l.id];
  const base = it.sizes ? it.sizes[l.size].price : it.price;
  return base + (l.addons || []).reduce((s, a) => s + it.addons.find((x) => x.id === a).price, 0);
}
```

- **Persist** to `localStorage` under a versioned key (`<slug>.cart.v1`), and wrap reads and writes in try/catch because private mode can throw.
- **On load, re-validate:** drop lines whose item, size or add-on no longer exists, and always **recompute prices from data** rather than trusting stored prices.
- Identical choices merge into one line, while different sizes or add-ons become separate lines.
- Items with options (sizes, heat level, add-ons) open an **options sheet**. That's a `<dialog>` built from radio cards, a segmented heat control, add-on checkboxes, a note field, a qty stepper and "Add · Rs X". Items with none get quick-added, with a toast.
- Reflect the cart back on the catalogue with an "in order" count and a highlighted border, and bump the nav cart count.

## 3. Checkout drawer

A right-side `<aside>` (full width on phones) with `inert` and `aria-hidden` while closed, a scrim, Escape to close, and focus returned to the opener. It has three parts:
- **Scrollable body** (`data-lenis-prevent`):
  - a Delivery / Pickup toggle and a closed-hours notice;
  - the lines, each with a qty stepper and Remove;
  - a free-delivery progress bar;
  - the details form: name, phone, area (select, which sets the fee and ETA), address, landmark, when (ASAP or 30-minute slots within opening hours), payment method and a rider note.
- **Sticky foot:** subtotal, fee ("Choose area" until an area is picked, "Free" above the threshold), total, a minimum-order note, and the main button "Send order on WhatsApp · Rs X".
- **Validation:** name has at least 2 characters, the phone has at least 10 digits, and delivery orders need an area and an address. Mark the `.field.is-error`, toast a one-line reason, and scroll the first bad field into view.
- **After sending:** open the WhatsApp URL in a new tab, and switch the drawer to a done state with the name, an order reference, a "WhatsApp didn't open? Tap here" link and "Start a new order". Then clear the cart.
- On phones, show a sticky bottom bar "View your order · N · Rs X" whenever the cart has items.

## 4. The WhatsApp message

```js
const ref = 'AG-' + Date.now().toString(36).slice(-5).toUpperCase();
const msg = [
  `Hi ${BIZ.name}! New order ${ref}`,
  delivery ? `*Delivery* to ${zone.name}` : '*Pickup*',
  '',
  ...lines.map((l) => `• ${l.qty}× ${nameOf(l)}${opts(l) ? ` (${opts(l)})` : ''} = ${rs(unitPrice(l) * l.qty)}${l.note ? `\n   Note: ${l.note}` : ''}`),
  '',
  `Subtotal: ${rs(sub)}`, delivery ? `Delivery: ${fee ? rs(fee) : 'Free'}` : null, `*Total: ${rs(total)}*`,
  `Payment: ${pay}`, `When: ${when}`, '',
  `Name: ${name}`, `Phone: ${phone}`, delivery ? `Address: ${address}` : null,
].filter((x) => x !== null).join('\n');
window.open(`https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
```

WhatsApp renders `*bold*`. Keep it plain text otherwise, with one item per line, so the business can read it at a glance on a phone.

## 5. Variants by business type

| Business | Core flow | Extras that worked |
|---|---|---|
| Restaurant | sticky category chips + menu (photo cards and compact rows) → options sheet → cart drawer | deals and combos with "Save Rs X", a time-limited lunch deal, delivery zones and fees, live open/closed status |
| Shop (toys, gadgets) | filterable product grid + search + sort → cart | a "product finder" quiz (age, budget, type → picks), featured deals, free-delivery bar, "check before you pay" |
| Service studio (detailing, salon, clinic) | **quote builder**: radio cards for size or tier, add-ons, live estimate, a visual that reacts to choices → booking dialog (date, time, details) | a bundle saving, days-in-studio estimate, before/after slider |
| Wholesaler | catalogue with MOQ and price tiers → bulk inquiry list | tiered pricing table, "request catalogue PDF" |

Pick the flow that matches how the business actually sells. A detailing studio doesn't have a cart, and a restaurant doesn't need a quote.

## 6. Opening hours and time-limited deals

Compute the time in the business's time zone. The visitor's clock may not be local.

```js
const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
const mins = () => { const p = clock.formatToParts(new Date()); return +p.find(x => x.type === 'hour').value * 60 + +p.find(x => x.type === 'minute').value; };
// hours past midnight are written as 24 + h (close: 26 = 2 AM)
const within = (t, a, b) => (t >= a && t < b) || (t + 1440 >= a && t + 1440 < b);
```

- Show a status pill ("Open · till 2 AM" / "Closed · opens 12 PM") in the nav and the visit section, and refresh it every 30 s.
- Build 30-minute slots from an hour ahead (or from opening time when closed) up to half an hour before closing. When closed, drop "ASAP" and explain the pre-order in the drawer.
- Time-limited deals (for example a lunch box from 12 to 4 PM) show a live countdown when active. Outside the window they're greyed out with the hours shown.

## 7. Pakistani market defaults

- **Currency:** `'Rs ' + Math.round(n).toLocaleString('en-PK')` gives "Rs 1,190". Keep prices realistic for the current market and category.
- **Payment:** cash on delivery first, then card on delivery, JazzCash or Easypaisa, and bank transfer.
- **Phone:** placeholder `03xx-xxxxxxx`. Accept anything with at least 10 digits.
- **Tone:** local words where they're natural (koyla, karahi, degh, "check before you pay"), with English as the main language. A small Urdu accent works if it's subset-loaded: Google Fonts `Noto Nastaliq Urdu` with a `&text=` parameter listing only the glyphs used.
- **Reviews and stats:** for a placeholder brand, sample reviews are fine but must be listed as placeholders in the README. For a real client, use their real reviews or none.
