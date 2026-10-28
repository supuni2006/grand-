import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type React from "react";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, Star, Phone, MapPin, Clock, Bike, Leaf, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import heroImg from "@/assets/koththu.jpg";
import healthy from "@/assets/healthy.jpg";
import logo from "@/assets/victoria-grand-logo.png";
import { MENU, REVIEWS, PHONE, PHONE_TEL, lkr, cartTotals, type Dish } from "@/lib/menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Victoria Grand – Sri Lankan Food in Wattala" },
      { name: "description", content: "Rice & curry, koththu and hoppers from The Victoria Grand, Wattala. Dine in, takeaway or delivery." },
      { property: "og:title", content: "The Victoria Grand – Wattala" },
      { property: "og:description", content: "Good food, good mood. Sri Lankan favourites cooked fresh daily." },
    ],
  }),
  component: Index,
});

function tilt(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty("--ry", `${x * 14}deg`);
  el.style.setProperty("--rx", `${-y * 14}deg`);
}
function untilt(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--ry", "0deg");
  e.currentTarget.style.setProperty("--rx", "0deg");
}

const CATS = ["All", "Mains", "Breakfast", "Drinks"] as const;

function Index() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const t = cartTotals(cart);

  const change = (name: string, d: number) =>
    setCart((c) => {
      const q = (c[name] ?? 0) + d;
      const n = { ...c };
      if (q <= 0) delete n[name];
      else n[name] = q;
      return n;
    });

  const add = (d: Dish) => {
    change(d.name, 1);
    toast.success(`${d.name} added to your order`);
  };

  const dishes = MENU.filter((d) => cat === "All" || d.category === cat);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
          <a href="#top" className="flex items-center gap-2.5">
            <img src={logo} alt="The Victoria Grand logo" className="h-11 w-11 rounded-xl object-cover shadow-soft ring-1 ring-border" />
            <span className="font-serif text-xl">Victoria Grand</span>
          </a>
          <nav className="ml-auto hidden gap-7 text-sm md:flex">
            <a href="#top" className="hover:text-accent">Home</a>
            <a href="#menu" className="hover:text-accent">Menu</a>
            <a href="#reviews" className="hover:text-accent">Reviews</a>
            <a href="#contact" className="hover:text-accent">Contact</a>
          </nav>
          <Button variant="outline" className="ml-auto rounded-full md:ml-0" onClick={() => setOpen(true)}>
            <ShoppingBag /> {count > 0 ? count : "Cart"}
          </Button>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden bg-warm">
        <img src={heroImg} alt="Koththu roti" className="float-3d absolute right-[6%] top-1/2 hidden aspect-square w-[38%] max-w-md rounded-[2.5rem] object-cover shadow-soft ring-8 ring-card md:block" style={{ top: "12%" }} />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-32">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The Victoria Grand · Wattala</p>
          <h1 className="text-3d mt-4 max-w-xl text-5xl leading-[1.05] md:text-7xl">Good food, <em className="text-accent">good mood.</em></h1>
          <p className="mt-6 max-w-md text-muted-foreground">Sri Lankan favourites cooked fresh every day — rice & curry, koththu and crisp hoppers. Dine in, take away, or have it delivered.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="btn-3d rounded-full px-7" asChild><a href="#menu">Order now</a></Button>
            <Button size="lg" variant="outline" className="rounded-full bg-card/60 px-7" asChild><a href={`tel:${PHONE_TEL}`}><Phone /> Call us</a></Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Bike className="h-4 w-4 text-accent" /> ~30 min delivery</span>
            <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-accent" /> Fresh daily</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Pay on delivery</span>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl">Our menu</h2>
            <p className="mt-2 text-sm text-muted-foreground">Typical spend LKR 500 – 1,000 per person.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)}>{c}</Button>
            ))}
          </div>
        </div>
        <div className="perspective-3d mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dishes.map((d) => (
            <article key={d.name} onMouseMove={tilt} onMouseLeave={untilt} className="card-3d group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-square overflow-hidden bg-secondary">
                {d.image ? (
                  <img src={d.image} alt={d.name} loading="lazy" width={816} height={816} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center text-7xl">{d.emoji}</div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.category}{d.veg && " · Veg option"}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{d.rating}</span>
                </div>
                <h3 className="mt-2 text-xl">{d.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{d.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold">{lkr(d.price)}</span>
                  <Button size="sm" className="btn-3d pop-3d rounded-full" onClick={() => add(d)}><Plus /> Add</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="relative flex min-h-[340px] items-center overflow-hidden rounded-3xl bg-warm md:min-h-[400px]">
          <img src={healthy} alt="Healthy Sri Lankan rice and curry bowl with fish, dhal and fresh vegetables" loading="lazy" width={1200} height={912} className="absolute inset-y-0 right-0 h-full w-1/2 object-cover object-center [mask-image:linear-gradient(90deg,transparent,black_35%)]" />
          <div className="relative max-w-sm p-10 md:p-14">
            <h2 className="text-4xl">Healthy choices, delivered</h2>
            <p className="mt-3 text-sm text-muted-foreground">Fresh, nutritious and delicious meals for a better you.</p>
            <Button className="mt-6 rounded-full" onClick={() => { setCat("Mains"); document.getElementById("menu")?.scrollIntoView(); }}>Explore mains</Button>
          </div>
        </div>
      </section>

      <section id="reviews" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-4xl md:text-5xl">What our guests say</h2>
        <p className="mt-2 text-sm text-muted-foreground">From Google reviews</p>
        <div className="perspective-3d mt-10 grid gap-5 md:grid-cols-3">
          {REVIEWS.map(([n, s, txt, when]) => (
            <figure key={n} onMouseMove={tilt} onMouseLeave={untilt} className="card-3d rounded-2xl border border-border bg-card p-6">
              <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < s ? "fill-primary text-primary" : "text-border"}`} />)}</div>
              <blockquote className="mt-4 font-serif text-lg leading-snug">“{txt}”</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">{n} · {when}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-4xl md:text-5xl">Contact & location</h2>
        <p className="mt-2 text-sm text-muted-foreground">587/A Negombo Main Rd, Wattala · <a href={`tel:${PHONE_TEL}`} className="text-accent">{PHONE}</a> · Daily 6:00 AM – 10:15 PM</p>
        <div className="mt-8 overflow-hidden rounded-3xl border border-border shadow-soft">
          <iframe
            title="The Victoria Grand on Google Maps"
            src="https://maps.google.com/maps?q=The%20Victoria%20Grand%2C%20587%2FA%20Negombo%20Main%20Rd%2C%20Wattala%2C%20Sri%20Lanka&z=16&output=embed"
            className="h-[420px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <Button variant="outline" className="mt-4 rounded-full" asChild>
          <a href="https://www.google.com/maps/search/?api=1&query=The+Victoria+Grand+587%2FA+Negombo+Main+Rd+Wattala" target="_blank" rel="noreferrer"><MapPin /> Get directions</a>
        </Button>
      </section>

      <footer id="visit" className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-3">
          <div>
            <img src={logo} alt="The Victoria Grand logo" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/50" />
            <p className="mt-4 font-serif text-3xl text-primary">The Victoria Grand</p>
            <p className="mt-2 text-sm opacity-80">Good Food. Good Mood.</p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-primary" /> 587/A Negombo Main Rd, Wattala, Sri Lanka</p>
            <p className="flex gap-3"><Phone className="h-4 w-4 shrink-0 text-primary" /> <a href={`tel:${PHONE_TEL}`}>{PHONE}</a></p>
            <p className="flex gap-3"><Clock className="h-4 w-4 shrink-0 text-primary" /> Daily 6:00 AM – 10:15 PM</p>
          </div>
          <div className="text-sm opacity-80">Dine in · Takeaway · Free parking</div>
        </div>
        <p className="border-t border-ink-foreground/10 py-5 text-center text-xs opacity-60">© 2026 The Victoria Grand. All rights reserved.</p>
      </footer>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader><SheetTitle className="font-serif text-2xl font-normal">Your order</SheetTitle></SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {count === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Your cart is empty.</p>}
            {Object.entries(cart).map(([name, q]) => {
              const d = MENU.find((m) => m.name === name)!;
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-2xl">{d.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{lkr(d.price * q)}</p>
                  </div>
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => change(name, -1)}><Minus /></Button>
                  <span className="w-5 text-center">{q}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => change(name, 1)}><Plus /></Button>
                </div>
              );
            })}
          </div>
          {count > 0 && (
            <div className="space-y-2 border-t border-border p-4 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{lkr(t.subtotal)}</span></div>
              <div className="flex justify-between"><span>Delivery</span><span>{lkr(t.delivery)}</span></div>
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{lkr(t.total)}</span></div>
              <Button size="lg" className="mt-3 w-full rounded-full" asChild><a href={`tel:${PHONE_TEL}`}><Phone /> Call to place order</a></Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
