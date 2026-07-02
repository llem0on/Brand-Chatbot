export type MockProduct = {
  id: string;
  name: string;
  price: string;
  image: string;
  hoverImage?: string;
};

function unsplash(id: string, w = 1200) {
  return `https://images.unsplash.com/photo-${id}?q=80&w=${w}&auto=format&fit=crop`;
}

export const heroImage = unsplash("1490481651871-ab68de25d43d", 2400);

export const featuredProducts: MockProduct[] = [
  {
    id: "feat-1",
    name: "Mono Trench Coat",
    price: "Rp1.890.000",
    image: unsplash("1483985988355-763728e1935b", 1600),
    hoverImage: unsplash("1551488831-00ddcb6c6bd3", 1600),
  },
  {
    id: "feat-2",
    name: "Silk Slip Dress",
    price: "Rp1.250.000",
    image: unsplash("1469334031218-e382a71b716b", 1000),
    hoverImage: unsplash("1525507119028-ed4c629a60a3", 1000),
  },
  {
    id: "feat-3",
    name: "Tailored Wool Blazer",
    price: "Rp1.590.000",
    image: unsplash("1515886657613-9f3515b0c78f", 1000),
    hoverImage: unsplash("1485230895905-ec40ba36b9bc", 1000),
  },
];

export const categories = [
  { id: "pria", label: "Pria", image: unsplash("1441986300917-64674bd600d8", 1200) },
  { id: "wanita", label: "Wanita", image: unsplash("1490578474895-699cd4e2cf59", 1200) },
  { id: "aksesoris", label: "Aksesoris", image: unsplash("1542060748-10c28b62716f", 1200) },
];

export const newArrivals: MockProduct[] = [
  {
    id: "new-1",
    name: "Draped Midi Skirt",
    price: "Rp780.000",
    image: unsplash("1483985988355-763728e1935b", 900),
  },
  {
    id: "new-2",
    name: "Cashmere Knit Top",
    price: "Rp950.000",
    image: unsplash("1525507119028-ed4c629a60a3", 900),
  },
  {
    id: "new-3",
    name: "Structured Tote",
    price: "Rp1.120.000",
    image: unsplash("1567401893414-76b7b1e5a7a5", 900),
  },
  {
    id: "new-4",
    name: "Satin Slip Skirt",
    price: "Rp890.000",
    image: unsplash("1503342217505-b0a15ec3261c", 900),
  },
];
