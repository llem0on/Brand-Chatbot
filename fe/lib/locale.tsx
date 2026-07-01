"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Locale = "id" | "en" | "zh";
export const LOCALES: Locale[] = ["id", "en", "zh"];
export const LOCALE_LABELS: Record<Locale, string> = { id: "ID", en: "EN", zh: "中" };

export type Translations = {
  // ── Navbar ──────────────────────────────────────────────────────────────
  home: string; collection: string; signIn: string;
  myOrders: string; cart: string; orders: string; signOut: string;

  // ── Hero ────────────────────────────────────────────────────────────────
  heroEdition: string;
  heroTagline: string;
  heroCtaShop: string;
  heroCtaFitting: string;

  // ── BrandStatement ──────────────────────────────────────────────────────
  quotePart1: string;
  quoteDescribing: string;
  quotePart2: string;
  quoteProposing: string;
  quotePart3: string;
  quoteCaption: string;

  // ── FeaturedCollection ──────────────────────────────────────────────────
  sectionForms: string;
  formsSub: string;
  formSub1: string; formSub2: string; formSub3: string;
  formSub4: string; formSub5: string; formSub6: string;

  // ── NewArrivals (journal) ───────────────────────────────────────────────
  journalHeading: string;
  journalSub: string;
  readNote: string;
  journalCat1: string; journalCat2: string; journalCat3: string;
  journalTitle1: string; journalTitle2: string; journalTitle3: string;

  // ── StorySection ─────────────────────────────────────────────────────────
  atelierEyebrow: string;
  atelierLeadPre: string;
  atelierLeadHl: string;
  atelierLeadPost: string;
  railFounded: string; railWhere: string; railPerEdition: string;
  railMethod: string;  railSeen: string;
  railFoundedVal: string; railWhereVal: string; railPerEditionVal: string;
  railMethodVal: string; railSeenVal: string;
  prose1Pre: string; prose1Hl: string; prose1Post: string;
  prose2: string;
  prose3Pre: string; prose3Hl: string; prose3Post: string;

  // ── MarqueeStrip ─────────────────────────────────────────────────────────
  marqueeMade: string;
  marqueeCity: string;
  marqueeAppt: string;

  // ── Footer ───────────────────────────────────────────────────────────────
  footerTagline: string;
  footerShop: string;
  footerAtelier: string;
  footerReach: string;

  // ── Koleksi page ─────────────────────────────────────────────────────────
  loading: string;
  noProducts: string;
  resetFilter: string;
  itemsAvailable: (n: number) => string;
  selectCollection: string;
  koleksiSub: string;
  filter: string;
  reset: string;
  buy: string;
  filterCategory: string;
  filterGender: string;
  filterMaterial: string;
  filterSize: string;
  filterColor: string;

  // ── Keranjang page ───────────────────────────────────────────────────────
  cartTitle: string;
  cartEmpty: string;
  cartEmptyMsg: string;
  viewCollection: string;
  subtotal: (qty: number) => string;
  shippingNote: string;
  checkout: string;
  continueShopping: string;

  // ── Pesanan page ─────────────────────────────────────────────────────────
  account: string;
  myOrdersTitle: string;
  notLoggedIn: string;
  notLoggedInMsg: string;
  signInGoogle: string;
  tabOngoing: string;
  tabCompleted: string;
  tabCancelled: string;
  noOrders: string;
  noOrdersInTab: string;
  startShopping: string;
  shipping: string;
  total: string;
  paymentRejected: string;
  proofSent: string;
  viewProof: string;
  awaitingPayment: string;
  statusPending: string;
  statusPaid: string;
  statusShipped: string;
  statusDone: string;
  statusCancelled: string;

};

const T: Record<Locale, Translations> = {
  // ════════════════════════════════════════════════════════════════════════
  id: {
    // Navbar
    home: "Beranda", collection: "Koleksi", signIn: "Masuk",
    myOrders: "Pesanan Saya", cart: "Keranjang", orders: "Pesanan", signOut: "Keluar",
    // Hero
    heroEdition: "Édition 04 — koleksi atasan terbatas",
    heroTagline: "Atelier yang hanya mengerjakan atasan. Satu koleksi kecil — dipotong dan dipotong lagi hingga siluetnya berdiri sendiri.",
    heroCtaShop: "Lihat koleksi",
    heroCtaFitting: "Request fitting",
    // BrandStatement
    quotePart1: "Kami tertarik pada apa yang terjadi pada sebuah atasan ketika ia berhenti",
    quoteDescribing: "mendeskripsikan",
    quotePart2: "tubuh dan mulai",
    quoteProposing: "mengusulkan",
    quotePart3: "sebuah bentuk.",
    quoteCaption: "— Catatan dari atelier, n°04",
    // FeaturedCollection
    sectionForms: "Koleksi",
    formsSub: "Enam potongan · Édition 04\nHarga dalam IDR",
    formSub1: "Ditopang oleh tegangan",
    formSub2: "Bentuk dari ketiadaan",
    formSub3: "Satu garis bersih",
    formSub4: "Dua bagian yang tak sama",
    formSub5: "Arsitektur terlipat",
    formSub6: "Bergerak satu ketukan di belakang",
    // NewArrivals
    journalHeading: "Dari jurnal",
    journalSub: "Proses & catatan\nDiperbarui setiap bulan",
    readNote: "Baca catatan",
    journalCat1: "Catatan", journalCat2: "Proses", journalCat3: "Studio",
    journalTitle1: "Tentang ruang negatif, dan apa yang ditinggalkan sebuah atasan",
    journalTitle2: "Memotong untuk ketenangan: garis yang menopang",
    journalTitle3: "Sebuah atasan dalam tiga lipatan — sebuah studi",
    // StorySection
    atelierEyebrow: "Atelier — sebuah manifesto",
    atelierLeadPre: "Kami membuat satu hal. Sebuah atasan — dipotong, diletakkan, dan dipotong lagi, hingga ia memiliki",
    atelierLeadHl: "bentuknya sendiri",
    atelierLeadPost: ".",
    railFounded: "Didirikan", railWhere: "Lokasi", railPerEdition: "Per edisi",
    railMethod: "Metode", railSeen: "Kunjungan",
    railFoundedVal: "2026", railWhereVal: "Jakarta, ID", railPerEditionVal: "Enam potongan",
    railMethodVal: "Dibuat dengan tangan", railSeenVal: "Dengan perjanjian",
    prose1Pre: "Kami mulai dengan sebuah penolakan: membiarkan kain menentukan bentuk. Sebuah atasan bukan materialnya. Ia adalah garis di bahu, ketegangan di punggung, ",
    prose1Hl: "ruang yang dijaganya",
    prose1Post: " dari tubuh.",
    prose2: "Maka kami bekerja dalam jumlah kecil. Enam potongan per edisi, tidak lebih — masing-masing digambar, disampirkan, dan digambar ulang dengan tangan di satu studio Jakarta. Saat sebuah potongan sudah benar, kami membuatnya. Saat hampir benar, kami mulai lagi.",
    prose3Pre: "Tidak ada yang musiman. Tidak ada yang dibuat untuk dibuang. ",
    prose3Hl: "Atasan yang kamu simpan",
    prose3Post: " — karena ia tidak pernah mencoba mengikuti tren, hanya untuk menjadi bentuk yang layak dipakai.",
    // MarqueeStrip
    marqueeMade: "Dibuat dalam jumlah kecil",
    marqueeCity: "Dipotong di Jakarta",
    marqueeAppt: "Online & dengan perjanjian",
    // Footer
    footerTagline: "Sebuah atelier yang hanya mengerjakan atasan. Jumlah kecil, dipotong dan diselesaikan di Jakarta.",
    footerShop: "Belanja",
    footerAtelier: "Atelier",
    footerReach: "Kontak",
    // Koleksi
    loading: "Memuat...",
    noProducts: "Tidak ada produk ditemukan",
    resetFilter: "Reset Filter",
    itemsAvailable: (n) => `${n} item tersedia`,
    selectCollection: "Pilih Koleksi",
    koleksiSub: "— pilih karakter kamu",
    filter: "Filter",
    reset: "Reset",
    buy: "Beli",
    filterCategory: "Kategori",
    filterGender: "Gender",
    filterMaterial: "Material",
    filterSize: "Ukuran",
    filterColor: "Warna",
    // Keranjang
    cartTitle: "Keranjang Belanja",
    cartEmpty: "Keranjang Kosong",
    cartEmptyMsg: "Belum ada produk di keranjang.",
    viewCollection: "Lihat Koleksi",
    subtotal: (qty) => `Subtotal (${qty} item)`,
    shippingNote: "Ongkos kirim dan detail pembayaran akan dikonfirmasi setelah checkout via WhatsApp.",
    checkout: "Lanjut Checkout",
    continueShopping: "← Lanjut Belanja",
    // Pesanan
    account: "Akun",
    myOrdersTitle: "Pesanan Saya",
    notLoggedIn: "Belum login",
    notLoggedInMsg: "Login untuk melihat pesanan kamu.",
    signInGoogle: "Masuk dengan Google",
    tabOngoing: "Berlangsung",
    tabCompleted: "Selesai",
    tabCancelled: "Dibatalkan",
    noOrders: "Belum ada pesanan.",
    noOrdersInTab: "Tidak ada pesanan di kategori ini.",
    startShopping: "Mulai Belanja",
    shipping: "Ongkir",
    total: "Total",
    paymentRejected: "Bukti Pembayaran Ditolak",
    proofSent: "Bukti dikirim — menunggu verifikasi admin",
    viewProof: "Lihat bukti",
    awaitingPayment: "Menunggu pembayaran",
    statusPending: "Menunggu Pembayaran",
    statusPaid: "Sudah Dibayar",
    statusShipped: "Dalam Pengiriman",
    statusDone: "Selesai",
    statusCancelled: "Dibatalkan",
  },

  // ════════════════════════════════════════════════════════════════════════
  en: {
    // Navbar
    home: "Home", collection: "Collection", signIn: "Sign In",
    myOrders: "My Orders", cart: "Cart", orders: "Orders", signOut: "Sign Out",
    // Hero
    heroEdition: "Édition 04 — limited tops collection",
    heroTagline: "An atelier working only in tops. One small collection — cut and cut again until the silhouette stands on its own.",
    heroCtaShop: "View collection",
    heroCtaFitting: "Request fitting",
    // BrandStatement
    quotePart1: "We are interested in what a top becomes when it stops",
    quoteDescribing: "describing",
    quotePart2: "the body and starts",
    quoteProposing: "proposing",
    quotePart3: "a shape.",
    quoteCaption: "— Notes from the atelier, n°04",
    // FeaturedCollection
    sectionForms: "The forms",
    formsSub: "Six pieces · Édition 04\nPrices in IDR",
    formSub1: "Held by tension",
    formSub2: "Shape from absence",
    formSub3: "One clean line",
    formSub4: "Two unequal halves",
    formSub5: "Pressed architecture",
    formSub6: "Moves a beat behind",
    // NewArrivals
    journalHeading: "From the journal",
    journalSub: "Process & notes\nUpdated monthly",
    readNote: "Read note",
    journalCat1: "Notes", journalCat2: "Process", journalCat3: "Studio",
    journalTitle1: "On negative space, and what a top leaves out",
    journalTitle2: "Cutting for stillness: the line that holds",
    journalTitle3: "A top in three folds — a study",
    // StorySection
    atelierEyebrow: "The atelier — a manifesto",
    atelierLeadPre: "We make one thing. A top — cut, set down, and cut again, until it holds",
    atelierLeadHl: "a shape of its own",
    atelierLeadPost: ".",
    railFounded: "Founded", railWhere: "Where", railPerEdition: "Per edition",
    railMethod: "Method", railSeen: "Seen",
    railFoundedVal: "2026", railWhereVal: "Jakarta, ID", railPerEditionVal: "Six forms",
    railMethodVal: "Made by hand", railSeenVal: "By appointment",
    prose1Pre: "We started with a refusal: to let the cloth decide the form. A top is not its material. It is a line across the shoulders, a tension held at the back, the ",
    prose1Hl: "space it keeps",
    prose1Post: " from the body.",
    prose2: "So we work in small numbers. Six forms an edition, never more — each one drawn, draped, and re-drawn by hand in a single Jakarta studio. When a form is right, we make it. When it is almost right, we begin again.",
    prose3Pre: "Nothing seasonal. Nothing made to be thrown away. ",
    prose3Hl: "A top you keep",
    prose3Post: " — because it was never trying to be in fashion, only to be a shape worth wearing.",
    // MarqueeStrip
    marqueeMade: "Made in small quantities",
    marqueeCity: "Cut in Jakarta",
    marqueeAppt: "Online & by appointment",
    // Footer
    footerTagline: "An atelier working only in tops. Small numbers, cut and finished in Jakarta.",
    footerShop: "Shop",
    footerAtelier: "Atelier",
    footerReach: "Reach",
    // Koleksi
    loading: "Loading...",
    noProducts: "No products found",
    resetFilter: "Reset Filter",
    itemsAvailable: (n) => `${n} items available`,
    selectCollection: "Browse Collection",
    koleksiSub: "— select your character",
    filter: "Filter",
    reset: "Reset",
    buy: "Buy",
    filterCategory: "Category",
    filterGender: "Gender",
    filterMaterial: "Material",
    filterSize: "Size",
    filterColor: "Color",
    // Keranjang
    cartTitle: "Shopping Cart",
    cartEmpty: "Empty Cart",
    cartEmptyMsg: "No items in your cart yet.",
    viewCollection: "View Collection",
    subtotal: (qty) => `Subtotal (${qty} items)`,
    shippingNote: "Shipping costs and payment details will be confirmed after checkout via WhatsApp.",
    checkout: "Proceed to Checkout",
    continueShopping: "← Continue Shopping",
    // Pesanan
    account: "Account",
    myOrdersTitle: "My Orders",
    notLoggedIn: "Not signed in",
    notLoggedInMsg: "Sign in to view your orders.",
    signInGoogle: "Sign in with Google",
    tabOngoing: "Ongoing",
    tabCompleted: "Completed",
    tabCancelled: "Cancelled",
    noOrders: "No orders yet.",
    noOrdersInTab: "No orders in this category.",
    startShopping: "Start Shopping",
    shipping: "Shipping",
    total: "Total",
    paymentRejected: "Payment Proof Rejected",
    proofSent: "Proof submitted — awaiting admin verification",
    viewProof: "View proof",
    awaitingPayment: "Awaiting payment",
    statusPending: "Awaiting Payment",
    statusPaid: "Paid",
    statusShipped: "In Delivery",
    statusDone: "Completed",
    statusCancelled: "Cancelled",
  },

  // ════════════════════════════════════════════════════════════════════════
  zh: {
    // Navbar
    home: "首页", collection: "系列", signIn: "登入",
    myOrders: "我的订单", cart: "购物车", orders: "订单", signOut: "退出",
    // Hero
    heroEdition: "第04版 — 限量上装系列",
    heroTagline: "专注于上装的工作室。一个小系列——反复剪裁，直到轮廓自立。",
    heroCtaShop: "浏览系列",
    heroCtaFitting: "预约试穿",
    // BrandStatement
    quotePart1: "我们关注的是，当一件上装不再",
    quoteDescribing: "描述",
    quotePart2: "身体，而开始",
    quoteProposing: "构建",
    quotePart3: "形态时，它会变成什么。",
    quoteCaption: "— 工作室手记，第04号",
    // FeaturedCollection
    sectionForms: "形态",
    formsSub: "六件作品 · 第04版\n价格以印尼盾计",
    formSub1: "由张力支撑",
    formSub2: "源于缺席的形态",
    formSub3: "一条干净的线",
    formSub4: "两个不等的半面",
    formSub5: "折叠的建筑",
    formSub6: "慢一拍的律动",
    // NewArrivals
    journalHeading: "来自日志",
    journalSub: "过程与笔记\n每月更新",
    readNote: "阅读笔记",
    journalCat1: "笔记", journalCat2: "过程", journalCat3: "工作室",
    journalTitle1: "关于负空间，以及上装所省略的",
    journalTitle2: "为静止而剪裁：那条支撑的线",
    journalTitle3: "三重折叠中的上装——一项研究",
    // StorySection
    atelierEyebrow: "工作室 — 宣言",
    atelierLeadPre: "我们只做一件事。一件上装——剪裁、放置、再剪裁，直到它拥有",
    atelierLeadHl: "属于自己的形态",
    atelierLeadPost: "。",
    railFounded: "创立于", railWhere: "地点", railPerEdition: "每版数量",
    railMethod: "工艺", railSeen: "购买方式",
    railFoundedVal: "2026", railWhereVal: "雅加达，印尼", railPerEditionVal: "六件作品",
    railMethodVal: "手工制作", railSeenVal: "预约制",
    prose1Pre: "我们始于一种拒绝：拒绝让布料决定形态。上装不是它的材质。它是肩膀上的一条线，背后的一种张力，",
    prose1Hl: "与身体之间保持的空间",
    prose1Post: "。",
    prose2: "因此我们以小批量工作。每个版本六件，绝不更多——每件都在雅加达的单一工作室中手工绘制、悬挂、再绘制。当一件形态正确时，我们制作它。当它几乎正确时，我们重新开始。",
    prose3Pre: "没有季节性。没有为丢弃而制。",
    prose3Hl: "一件你会留下的上装",
    prose3Post: "——因为它从未试图跟随潮流，只是成为一个值得穿着的形态。",
    // MarqueeStrip
    marqueeMade: "小批量制作",
    marqueeCity: "在雅加达剪裁",
    marqueeAppt: "线上 & 预约到店",
    // Footer
    footerTagline: "专注于上装的工作室。小批量，在雅加达剪裁与完成。",
    footerShop: "购物",
    footerAtelier: "工作室",
    footerReach: "联系",
    // Koleksi
    loading: "加载中...",
    noProducts: "没有找到商品",
    resetFilter: "重置筛选",
    itemsAvailable: (n) => `${n} 件商品`,
    selectCollection: "浏览系列",
    koleksiSub: "— 选择你的风格",
    filter: "筛选",
    reset: "重置",
    buy: "购买",
    filterCategory: "类别",
    filterGender: "性别",
    filterMaterial: "材质",
    filterSize: "尺码",
    filterColor: "颜色",
    // Keranjang
    cartTitle: "购物车",
    cartEmpty: "购物车为空",
    cartEmptyMsg: "购物车中暂无商品。",
    viewCollection: "浏览系列",
    subtotal: (qty) => `小计（${qty} 件）`,
    shippingNote: "运费和付款详情将在通过 WhatsApp 结账后确认。",
    checkout: "前往结账",
    continueShopping: "← 继续购物",
    // Pesanan
    account: "账户",
    myOrdersTitle: "我的订单",
    notLoggedIn: "未登录",
    notLoggedInMsg: "请登录以查看您的订单。",
    signInGoogle: "使用 Google 登录",
    tabOngoing: "进行中",
    tabCompleted: "已完成",
    tabCancelled: "已取消",
    noOrders: "暂无订单。",
    noOrdersInTab: "此类别中没有订单。",
    startShopping: "开始购物",
    shipping: "运费",
    total: "合计",
    paymentRejected: "付款凭证被拒绝",
    proofSent: "凭证已提交 — 等待管理员审核",
    viewProof: "查看凭证",
    awaitingPayment: "等待付款",
    statusPending: "等待付款",
    statusPaid: "已付款",
    statusShipped: "配送中",
    statusDone: "已完成",
    statusCancelled: "已取消",
  },
};

interface LocaleCtx { locale: Locale; t: Translations; cycle: () => void; }
const Ctx = createContext<LocaleCtx>({ locale: "id", t: T["id"], cycle: () => {} });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("id");

  useEffect(() => {
    const saved = (localStorage.getItem("site-locale") as Locale) ?? "id";
    if (LOCALES.includes(saved)) setLocale(saved);
  }, []);

  function cycle() {
    setLocale((prev) => {
      const next = LOCALES[(LOCALES.indexOf(prev) + 1) % LOCALES.length];
      localStorage.setItem("site-locale", next);
      return next;
    });
  }

  return <Ctx.Provider value={{ locale, t: T[locale], cycle }}>{children}</Ctx.Provider>;
}

export function useLocale() { return useContext(Ctx); }
