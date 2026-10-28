// ===== EDIT THIS FILE to customise the site =====
const CONFIG = {
  // Paste your restaurant's PickMe Food link here (leave '' to hide the PickMe buttons)
  pickmeUrl: '',
  // WhatsApp number in international format, digits only (e.g. '94771234567'). '' = off.
  // When set, placing an order opens WhatsApp with the order text ready to send to the restaurant.
  whatsapp: '',
  // Your own order server (server.js). Orders are saved there and staff update the status at /admin.html.
  // '' = demo mode (no server, fake timed tracking).
  orderEndpoint: '/api/orders',
  deliveryFee: 150,                       // LKR
  heroImage: 'images/hero.jpg',           // big photo in the hero
  healthyImage: 'images/healthy.jpg'      // photo in the "Healthy Choices" banner
};

// [name, emoji fallback, description, category, vegetarian option (1/0), price LKR, rating, minutes, image path]
// Put your photos in images/dishes/ with these names (or change the paths). Missing photos fall back to the emoji.
// Prices and ratings are PLACEHOLDERS - replace with your real menu.
const MENU = [
  ["Rice & Curry","🍛","Rice with Sri Lankan curries and sambol.","Mains",1,750,4.6,15,"images/dishes/rice-curry.jpg"],
  ["Koththu","🍜","Chopped roti stir-fried on the hot plate.","Mains",1,850,4.7,15,"images/dishes/koththu.jpg"],
  ["Fried Rice","🍚","Wok-fried rice, generous portions.","Mains",1,700,4.5,12,"images/dishes/fried-rice.jpg"],
  ["String Hoppers","🥘","With curry and pol sambol.","Breakfast",0,600,4.6,10,"images/dishes/string-hoppers.jpg"],
  ["Egg Hoppers","🍳","Crisp-edged hoppers, fresh each morning.","Breakfast",0,500,4.4,10,"images/dishes/egg-hoppers.jpg"],
  ["Roti & Curry","🫓","Warm roti with dhal or chicken curry.","Breakfast",0,650,4.5,10,"images/dishes/roti-curry.jpg"],
  ["Tea & Coffee","☕","Ceylon tea and hot coffee.","Drinks",0,300,4.3,5,"images/dishes/tea-coffee.jpg"],
  ["Fresh Juices","🥤","Seasonal fruit juices.","Drinks",0,350,4.4,5,"images/dishes/juices.jpg"]
];

// [name, emoji fallback, image path]  (category circles on the home page)
const CATS = [
  ["Rice & Curry","🍛","images/categories/rice-curry.jpg"],
  ["Koththu","🍜","images/categories/koththu.jpg"],
  ["Fried Rice","🍚","images/categories/fried-rice.jpg"],
  ["Hoppers","🥘","images/categories/hoppers.jpg"],
  ["Roti","🫓","images/categories/roti.jpg"],
  ["Drinks","☕","images/categories/drinks.jpg"]
];

// Google reviews shown on the Reviews page: [name, stars, text, when]
const REV = [
  ["Shavinda Bopearachchi",5,"Top service from the steward called Stefan, and the meal is also really good.","11 months ago"],
  ["Dharshun Vamadevan",4,"Decent place for a quick dinner. String hopper and curry with pol sambol was tasty.","a year ago"],
  ["Sasindu Jayanath",5,"Fair price for a good food. Generous portions.","3 years ago"],
  ["shane jayawardena",5,"Very great foods, service and a lovely place to eat.","a year ago"],
  ["PKS Shraven",5,"Food: 5 / 5","a year ago"],
  ["Kaweesh Jayawardena",5,"Food: 5 / 5","2 years ago"],
  ["Clarence Mendis",5,"Food: 5 / 5 · Dine in","2 years ago"],
  ["Sanjaya Prabudda",4,"Food: 4 / 5 · Takeaway · Plenty of free parking","a year ago"],
  ["S S R Trade International",5,"Tasty food.","a year ago"]
];