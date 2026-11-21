(() => {
const $ = (s) => document.querySelector(s);
const MENU = {
  Antipasti: [
    ["Burrata, charred peach, basil oil", "Burrata from Andria, peach blistered in the oven.", 16, "V GF"],
    ["Beef carpaccio, parmesan, rocket", "Sirloin sliced 2 mm thin, 24-month parmesan, lemon.", 18, "GF"],
    ["Wood-fired focaccia, whipped ricotta", "Baked at the oven mouth, rosemary, acacia honey.", 12, "V"],
    ["Grilled octopus, white beans, chili", "Simmered 50 minutes, finished on the coals, cannellini.", 21, "GF"]],
  Primi: [
    ["Tagliolini, white truffle butter", "Twelve yolks per kilo of flour, cut by hand at ten.", 26, "V"],
    ["Pappardelle, wild boar ragu", "Boar shoulder, juniper and red wine, cooked eight hours.", 27, ""],
    ["Ricotta ravioli, sage, brown butter", "Sheep's ricotta, toasted Piedmont hazelnuts.", 24, "V"],
    ["Risotto, saffron, roasted marrow", "Carnaroli rice, Milanese saffron, one bone per plate.", 28, "GF"]],
  Secondi: [
    ["Roasted langoustine, fennel, orange", "Two langoustines, split and roasted over vine cuttings.", 38, "GF"],
    ["Braised short rib, polenta, red wine jus", "Four hours in Barolo, then crisped by the fire.", 36, "GF"],
    ["Whole sea bream, salsa verde", "A 600 g fish baked in a salt crust, serves one.", 34, "GF"],
    ["Aubergine parmigiana, smoked tomato", "Fior di latte, baked 40 minutes until it catches.", 22, "V"]],
  Dolci: [
    ["Panna cotta, amaretti, candied orange", "Vanilla bean, set the same day, crushed amaretti.", 11, "V"],
    ["Tiramisu, espresso, dark cocoa", "Mascarpone and savoiardi, assembled to order.", 12, "V"],
    ["Chocolate and almond torta, sea salt", "70% chocolate, ground almonds, no flour.", 12, "V GF"],
    ["Amalfi lemon sorbetto, Prosecco", "Poured at the table.", 10, "V GF"]],
  Vini: [
    ["Franciacorta Brut, glass", "Lombardy. Fine bubbles, brioche, dry finish.", 14, "V GF"],
    ["Vermentino, glass", "Sardinia. Salty and sharp, pours well with seafood.", 11, "V GF"],
    ["Nebbiolo, glass", "Piedmont. Tar and dried rose, firm tannin.", 16, "V GF"],
    ["Chianti Classico Riserva, bottle", "Tuscany. Sour cherry, leather, 36 months in oak.", 68, "V GF"]],
};
const names = Object.keys(MENU);
const tabs = $("#tabs"), panel = $("#panel"), fv = $("#f-veg"), fg = $("#f-gf"), count = $("#count");
let cur = names[0];

names.forEach((n, i) => {
  const b = document.createElement("button");
  b.role = "tab"; b.id = "tab-" + i; b.textContent = n;
  b.setAttribute("aria-controls", "panel");
  b.onclick = () => show(n, false);
  b.onkeydown = (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); show(names[(names.indexOf(cur) + d + names.length) % names.length], true); }
    if (e.key === "Home") { e.preventDefault(); show(names[0], true); }
    if (e.key === "End") { e.preventDefault(); show(names[names.length - 1], true); }
  };
  tabs.append(b);
});

function show(n, focus) {
  cur = n;
  [...tabs.children].forEach((b) => {
    const on = b.textContent === n;
    b.setAttribute("aria-selected", on);
    b.tabIndex = on ? 0 : -1;
    if (on) { panel.setAttribute("aria-labelledby", b.id); if (focus) b.focus(); }
  });
  render();
}

function render() {
  let match = 0;
  panel.innerHTML = MENU[cur].map(([t, d, p, tg]) => {
    const ok = (!fv.checked || tg.includes("V")) && (!fg.checked || tg.includes("GF"));
    if (ok) match++;
    const tags = tg.split(" ").filter(Boolean).map((x) => `<span class="tag" title="${x === "V" ? "Vegetarian" : "Gluten-free"}">${x}</span>`).join("");
    return `<article class="dish${ok ? "" : " dim"}"${ok ? "" : ' aria-hidden="true"'}><div class="top"><h3>${t}</h3>${tags}<span class="dots"></span><span class="p">&euro;${p}</span></div><p>${d}</p></article>`;
  }).join("");
  count.textContent = fv.checked || fg.checked ? `${match} of ${MENU[cur].length} match` : "";
}
fv.onchange = fg.onchange = render;
show(cur, false);

// nav
const burger = document.querySelector(".burger"), links = $("#links");
burger.onclick = () => { const o = links.classList.toggle("open"); burger.setAttribute("aria-expanded", o); };
links.onclick = (e) => { if (e.target.closest("a")) { links.classList.remove("open"); burger.setAttribute("aria-expanded", false); } };

// reservation
const date = $("#date"), party = $("#party"), slots = $("#slots"), form = $("#form"), live = $("#live"), sum = $("#summary");
const pad = (n) => String(n).padStart(2, "0");
const today = new Date();
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
date.min = iso(today);
for (let i = 1; i <= 10; i++) party.add(new Option(i === 1 ? "1 guest" : i + " guests", i, i === 2, i === 2));
const parse = (v) => { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d); };
const range = (a, b) => { const r = []; for (let m = a; m <= b; m += 30) r.push(`${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`); return r; };
// Hours per weekday (0 = Sunday); last seating 90 min before close
const HOURS = { 0: [750, 1230], 2: [1080, 1290], 3: [1080, 1290], 4: [1080, 1290], 5: [1080, 1350], 6: [1080, 1350] };

function drawSlots() {
  const d = date.value && parse(date.value);
  const h = d && HOURS[d.getDay()];
  const prev = (slots.querySelector("input:checked") || {}).value;
  if (!h) { slots.innerHTML = '<span class="demo" style="margin:0">Choose an open date to see times.</span>'; return; }
  const now = new Date();
  const free = range(h[0], h[1]).filter((t) => {
    const [hh, mm] = t.split(":").map(Number);
    return !(iso(d) === iso(now) && (hh * 60 + mm) <= now.getHours() * 60 + now.getMinutes());
  });
  slots.innerHTML = free.map((t) => `<label><input type="radio" name="time" value="${t}"${t === prev ? " checked" : ""}><span>${t}</span></label>`).join("") || '<span class="demo" style="margin:0">No more seatings today.</span>';
}
date.onchange = () => { sum.hidden = true; drawSlots(); setErr(date, "e-date", dateErr()); };
drawSlots();

function setErr(el, id, msg) {
  $("#" + id).textContent = msg || "";
  el.setAttribute("aria-invalid", !!msg);
  return !!msg;
}
function dateErr() {
  if (!date.value) return "Please pick a date.";
  const d = parse(date.value), t = parse(iso(today));
  if (d < t) return "That date has passed. Please choose today or later.";
  if (d.getDay() === 1) return "We are closed on Mondays. Please choose another day.";
  return "";
}
const contactErr = (v) => !v.trim() ? "Please enter a phone number or email." :
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || /^\+?[\d\s().-]{7,}$/.test(v.trim()) ? "" : "Enter a valid email or phone number.";

form.onsubmit = (e) => {
  e.preventDefault();
  const name = $("#name"), contact = $("#contact"), time = form.querySelector("input[name=time]:checked");
  const bad = [
    setErr(date, "e-date", dateErr()) && date,
    (() => { $("#e-time").textContent = time ? "" : "Please choose a time."; return !time && slots.querySelector("input"); })() || (!time && date),
    setErr(name, "e-name", name.value.trim().length < 2 ? "Please enter your name." : "") && name,
    setErr(contact, "e-contact", contactErr(contact.value)) && contact,
  ].filter(Boolean);
  if (bad.length) {
    live.textContent = `Please fix ${bad.length} ${bad.length === 1 ? "field" : "fields"} before continuing.`;
    sum.hidden = true; bad[0].focus(); return;
  }
  live.textContent = "";
  const long = parse(date.value).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  sum.innerHTML = `<h3>Grazie, ${esc(name.value.trim().split(" ")[0])}.</h3><dl><dt>Date</dt><dd>${long}</dd><dt>Time</dt><dd>${time.value}</dd><dt>Party</dt><dd>${party.value} ${party.value === "1" ? "guest" : "guests"}</dd><dt>Contact</dt><dd>${esc(contact.value.trim())}</dd>${$("#tasting-opt").checked ? "<dt>Menu</dt><dd>Chef&rsquo;s tasting menu</dd>" : ""}</dl><p class="small">This is a demo. Nothing was sent or saved, and no table is actually booked.</p>`;
  sum.hidden = false; sum.focus();
};
document.querySelector("[data-tasting]").onclick = () => { $("#tasting-opt").checked = true; };

// embers
const cv = $("#embers"), cx = cv.getContext("2d");
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let w, h, ps = [];
  const fit = () => { w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight; };
  fit(); addEventListener("resize", fit);
  const mk = (init) => ({ x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: Math.random() * 1.6 + .4, vy: Math.random() * .35 + .15, ph: Math.random() * 6, a: Math.random() * .5 + .3 });
  const N = Math.min(60, Math.round(innerWidth / 22));
  for (let i = 0; i < N; i++) ps.push(mk(true));
  (function loop(t) {
    cx.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.y -= p.vy; p.x += Math.sin(t / 1800 + p.ph) * .25;
      if (p.y < -10) Object.assign(p, mk(false));
      const f = p.a * (.6 + .4 * Math.sin(t / 300 + p.ph)) * Math.min(1, p.y / (h * .5));
      cx.fillStyle = `rgba(232,170,90,${Math.max(f, 0)})`;
      
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
    }
    requestAnimationFrame(loop);
  })(0);
}
})();
