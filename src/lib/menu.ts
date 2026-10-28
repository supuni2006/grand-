import riceCurry from "@/assets/rice-curry.jpg";
import koththu from "@/assets/koththu.jpg";
import hoppers from "@/assets/hoppers.jpg";
import friedRice from "@/assets/fried-rice.jpg";
import eggHoppers from "@/assets/egg-hoppers.jpg";
import rotiCurry from "@/assets/roti-curry.jpg";
import teaCoffee from "@/assets/tea-coffee.jpg";
import juices from "@/assets/juices.jpg";

export type Dish = {
  name: string;
  desc: string;
  category: "Mains" | "Breakfast" | "Drinks";
  veg: boolean;
  price: number;
  rating: number;
  minutes: number;
  emoji: string;
  image?: string;
};

export const DELIVERY_FEE = 150;
export const PHONE = "+94 112 935 757";
export const PHONE_TEL = "+94112935757";

// Prices and ratings are placeholders carried over from the original site.
export const MENU: Dish[] = [
  { name: "Rice & Curry", emoji: "🍛", desc: "Rice with Sri Lankan curries and sambol.", category: "Mains", veg: true, price: 750, rating: 4.6, minutes: 15, image: riceCurry },
  { name: "Koththu", emoji: "🍜", desc: "Chopped roti stir-fried on the hot plate.", category: "Mains", veg: true, price: 850, rating: 4.7, minutes: 15, image: koththu },
  { name: "Fried Rice", emoji: "🍚", desc: "Wok-fried rice, generous portions.", category: "Mains", veg: true, price: 700, rating: 4.5, minutes: 12, image: friedRice },
  { name: "String Hoppers", emoji: "🥘", desc: "With curry and pol sambol.", category: "Breakfast", veg: false, price: 600, rating: 4.6, minutes: 10, image: hoppers },
  { name: "Egg Hoppers", emoji: "🍳", desc: "Crisp-edged hoppers, fresh each morning.", category: "Breakfast", veg: false, price: 500, rating: 4.4, minutes: 10, image: eggHoppers },
  { name: "Roti & Curry", emoji: "🫓", desc: "Warm roti with dhal or chicken curry.", category: "Breakfast", veg: false, price: 650, rating: 4.5, minutes: 10, image: rotiCurry },
  { name: "Tea & Coffee", emoji: "☕", desc: "Ceylon tea and hot coffee.", category: "Drinks", veg: false, price: 300, rating: 4.3, minutes: 5, image: teaCoffee },
  { name: "Fresh Juices", emoji: "🥤", desc: "Seasonal fruit juices.", category: "Drinks", veg: false, price: 350, rating: 4.4, minutes: 5, image: juices },
];

export const REVIEWS: [string, number, string, string][] = [
  ["Shavinda Bopearachchi", 5, "Top service from the steward called Stefan, and the meal is also really good.", "11 months ago"],
  ["Dharshun Vamadevan", 4, "Decent place for a quick dinner. String hopper and curry with pol sambol was tasty.", "a year ago"],
  ["Sasindu Jayanath", 5, "Fair price for a good food. Generous portions.", "3 years ago"],
  ["shane jayawardena", 5, "Very great foods, service and a lovely place to eat.", "a year ago"],
  ["Sanjaya Prabudda", 4, "Takeaway · Plenty of free parking", "a year ago"],
  ["S S R Trade International", 5, "Tasty food.", "a year ago"],
];

export const lkr = (n: number) => `LKR ${n.toLocaleString("en-LK")}`;

export function cartTotals(items: Record<string, number>) {
  const subtotal = Object.entries(items).reduce(
    (s, [name, q]) => s + (MENU.find((d) => d.name === name)?.price ?? 0) * q,
    0,
  );
  const delivery = subtotal > 0 ? DELIVERY_FEE : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}
