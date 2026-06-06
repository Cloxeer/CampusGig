/**
 * ASNMSU student discounts — static list sourced from ASNMSU Services.
 * @see https://asnmsu.nmsu.edu/our-services/discounts.html
 */

export const ASNMSU_SOURCE_URL = "https://asnmsu.nmsu.edu/our-services/discounts.html";

/** @typedef {'top' | 'more'} DiscountTier */

/**
 * @typedef {Object} AsnmsuDiscount
 * @property {string} id
 * @property {string} name
 * @property {string} discountLabel
 * @property {number | null} discountPercent — for sort/display; null if variable
 * @property {string} category
 * @property {string | null} address
 * @property {string | null} phone — digits and punctuation ok
 * @property {string} mapsQuery
 * @property {string | null} hoursNote
 * @property {DiscountTier} tier
 * @property {string} imageKey — future: /discounts/{imageKey}.webp
 */

/** @type {AsnmsuDiscount[]} */
export const ASNMSU_DISCOUNTS = [
  {
    id: "color-me-mine",
    name: "Color Me Mine",
    discountLabel: "40% off studio fee",
    discountPercent: 40,
    category: "Activities",
    address: "535 N Main St, Las Cruces, NM",
    phone: "5752946915",
    mapsQuery: "Color Me Mine 535 N Main St Las Cruces NM",
    hoursNote: null,
    tier: "top",
    imageKey: "color-me-mine",
  },
  {
    id: "simply-fresh",
    name: "Simply Fresh",
    discountLabel: "Up to 50% off",
    discountPercent: 50,
    category: "Food",
    address: "125 S Campo St, Las Cruces, NM",
    phone: "5755004331",
    mapsQuery: "Simply Fresh 125 S Campo St Las Cruces NM",
    hoursNote: "Pre-order · Mon–Wed 10% · Thu 30% · Fri 50%",
    tier: "top",
    imageKey: "simply-fresh",
  },
  {
    id: "dtp-drive",
    name: "DTP Drive",
    discountLabel: "20% off",
    discountPercent: 20,
    category: "Wellness",
    address: null,
    phone: "5753435206",
    mapsQuery: "DTP Drive Las Cruces NM",
    hoursNote: "IV hydration & vitamin shots",
    tier: "top",
    imageKey: "dtp-drive",
  },
  {
    id: "super-8",
    name: "Super 8 University",
    discountLabel: "20% off room rates",
    discountPercent: 20,
    category: "Stay",
    address: "245 La Posada Ln, Las Cruces, NM",
    phone: "5755238695",
    mapsQuery: "Super 8 University 245 La Posada Ln Las Cruces NM",
    hoursNote: null,
    tier: "top",
    imageKey: "super-8",
  },
  {
    id: "hteo",
    name: "HTeaO",
    discountLabel: "20% off",
    discountPercent: 20,
    category: "Drinks",
    address: "2223 N Main St, Las Cruces, NM",
    phone: "5758883431",
    mapsQuery: "HTeaO 2223 N Main St Las Cruces NM",
    hoursNote: null,
    tier: "top",
    imageKey: "hteo",
  },
  {
    id: "lorenzos",
    name: "Lorenzo's",
    discountLabel: "20% off",
    discountPercent: 20,
    category: "Food",
    address: null,
    phone: "5755213505",
    mapsQuery: "Lorenzo's Italian Las Cruces NM",
    hoursNote: "Dine-in or takeout",
    tier: "top",
    imageKey: "lorenzos",
  },
  {
    id: "optimum-body",
    name: "Optimum Body Shop",
    discountLabel: "20% off services",
    discountPercent: 20,
    category: "Wellness",
    address: "2750 Mall Dr Suite 240, Las Cruces, NM",
    phone: "5755714385",
    mapsQuery: "Optimum Body Shop 2750 Mall Dr Las Cruces NM",
    hoursNote: null,
    tier: "top",
    imageKey: "optimum-body",
  },
  {
    id: "posh-skin",
    name: "Posh Skin Care",
    discountLabel: "15% off services",
    discountPercent: 15,
    category: "Wellness",
    address: null,
    phone: "5756440358",
    mapsQuery: "Posh Skin Care Las Cruces NM",
    hoursNote: "Mon–Wed only",
    tier: "more",
    imageKey: "posh-skin",
  },
  {
    id: "the-game",
    name: "The Game Sports & Bar",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Food & drink",
    address: "2605 S Espina, Las Cruces, NM",
    phone: "5755244263",
    mapsQuery: "The Game Sports Bar 2605 S Espina Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "the-game",
  },
  {
    id: "keva-juice",
    name: "Keva Juice",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Drinks",
    address: "1001 E University Ave D1, Las Cruces, NM",
    phone: "5755224133",
    mapsQuery: "Keva Juice 1001 E University Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "keva-juice",
  },
  {
    id: "outdoor-adventures",
    name: "Outdoor Adventures",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Gear",
    address: "1424 Missouri Ave, Las Cruces, NM",
    phone: "5756493953",
    mapsQuery: "Outdoor Adventures 1424 Missouri Ave Las Cruces NM",
    hoursNote: "Gear & equipment",
    tier: "more",
    imageKey: "outdoor-adventures",
  },
  {
    id: "med-park-optical",
    name: "Med Park Optical Shoppe",
    discountLabel: "10% off purchases",
    discountPercent: 10,
    category: "Services",
    address: "1300 El Paseo Suite 268, Las Cruces, NM",
    phone: "5755242666",
    mapsQuery: "Med Park Optical Shoppe Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "med-park-optical",
  },
  {
    id: "king-market",
    name: "King Market & Grill",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Food",
    address: "1001 S Solano Dr, Las Cruces, NM",
    phone: "5755569109",
    mapsQuery: "King Market Grill 1001 S Solano Dr Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "king-market",
  },
  {
    id: "roadrunner-pizza",
    name: "Roadrunner Pizza",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Food",
    address: null,
    phone: "5755223600",
    mapsQuery: "Roadrunner Pizza Las Cruces NM",
    hoursNote: "Carry-out or delivery",
    tier: "more",
    imageKey: "roadrunner-pizza",
  },
  {
    id: "fancy-nails",
    name: "Fancy Nails",
    discountLabel: "10% off services",
    discountPercent: 10,
    category: "Services",
    address: null,
    phone: "5755232154",
    mapsQuery: "Fancy Nails Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "fancy-nails",
  },
  {
    id: "spicy-bean",
    name: "Spicy Bean",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Food",
    address: "1001 E University Ave Suite B1, Las Cruces, NM",
    phone: null,
    mapsQuery: "Spicy Bean 1001 E University Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "spicy-bean",
  },
  {
    id: "bite-of-belgium",
    name: "Bite of Belgium",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Food",
    address: "741 N Alameda Blvd Suite 16, Las Cruces, NM",
    phone: null,
    mapsQuery: "Bite of Belgium 741 N Alameda Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "bite-of-belgium",
  },
  {
    id: "farmesilla",
    name: "FarMesilla",
    discountLabel: "10% off",
    discountPercent: 10,
    category: "Food",
    address: "1840 Avenida De Mesilla, Las Cruces, NM",
    phone: "5756524626",
    mapsQuery: "FarMesilla 1840 Avenida De Mesilla Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "farmesilla",
  },
  {
    id: "sushi-freak",
    name: "Sushi Freak",
    discountLabel: "Student deal",
    discountPercent: null,
    category: "Food",
    address: "2808 N Telshor Blvd, Las Cruces, NM",
    phone: "5752220496",
    mapsQuery: "Sushi Freak 2808 N Telshor Las Cruces NM",
    hoursNote: "Ask in store for details",
    tier: "more",
    imageKey: "sushi-freak",
  },
  {
    id: "paleta-bar",
    name: "The Paleta Bar",
    discountLabel: "Student offer",
    discountPercent: null,
    category: "Treats",
    address: "1181 Mall Dr Ste E, Las Cruces, NM",
    phone: "5756526911",
    mapsQuery: "The Paleta Bar 1181 Mall Dr Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "paleta-bar",
  },
  {
    id: "ronis-mac",
    name: "Roni's Mac Bar",
    discountLabel: "Student offer",
    discountPercent: null,
    category: "Food",
    address: "2750 Mall Dr Suite 260, Las Cruces, NM",
    phone: "5752013583",
    mapsQuery: "Roni's Mac Bar 2750 Mall Dr Las Cruces NM",
    hoursNote: null,
    tier: "more",
    imageKey: "ronis-mac",
  },
];

export function mapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function telUrl(phone) {
  const digits = String(phone).replace(/\D/g, "");
  return `tel:+1${digits}`;
}

export function formatPhone(phone) {
  const d = String(phone).replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

export function getDiscountsByTier(tier) {
  return ASNMSU_DISCOUNTS.filter((d) => d.tier === tier).sort((a, b) => {
    const pa = a.discountPercent ?? 0;
    const pb = b.discountPercent ?? 0;
    return pb - pa;
  });
}
