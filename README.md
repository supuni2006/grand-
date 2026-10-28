# The Victoria Grand website

Files: `index.html` (page + code), `config.js` (all settings, menu, reviews), `images/`, `server.js` (optional order receiver).

## Run
- Quick look: open `index.html` in a browser.
- With order receiving: `node server.js`, open http://localhost:3000 and set `orderEndpoint: '/api/orders'` in `config.js`. Orders are saved to `orders.json`.
- Or upload the folder to any static host (Netlify, Vercel, cPanel).

## Change images
- Hero photo: replace `images/hero.jpg` (landscape-ish, ~1200px wide). Banner: replace `images/healthy.jpg`.
- Dish photos: save as the names listed in `config.js` inside `images/dishes/` (square, ~600px). Category circles: `images/categories/`.
- Missing photos automatically fall back to the emoji.
- The two starter photos were cropped from the design mockup; replace them with your own food photos.

## PickMe
No public PickMe Food merchant API was found, so there is no direct "send order into the PickMe app" feature in this code. Options:
1. Get your restaurant listed on PickMe Food through their merchant onboarding, then paste your listing link into `pickmeUrl` in `config.js` - "Order on PickMe Food" buttons appear in the hero and cart.
2. Orders placed on this website go to you via WhatsApp (`whatsapp`) and/or your own server (`orderEndpoint`).
3. Ask PickMe's merchant team whether they offer an integration for restaurants; if they give you API docs, add the call inside `sendOrder()` in `index.html`.
Edit prices, ratings, delivery fee and menu in `config.js`; the current ones are placeholders.
