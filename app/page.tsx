import Navbar from "@/components/Navbar";
import BgCanvas from "@/components/BgCanvas";
import Hero from "@/components/Hero";
import MarqueeStrip from "@/components/MarqueeStrip";
import FeaturedCollection from "@/components/FeaturedCollection";
import BrandStatement from "@/components/BrandStatement";
import NewArrivals from "@/components/NewArrivals";
import StorySection from "@/components/StorySection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <BgCanvas />
      <Navbar />
      <main data-page="home" style={{ position: "relative", zIndex: 1 }}>
        {/* Hero + ticker in one 100svh block, ticker pinned to bottom */}
        <div style={{ position: "relative", height: "100svh", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <Hero />
          </div>
          <MarqueeStrip />
        </div>
        <FeaturedCollection />
        <BrandStatement />
        <NewArrivals />
        <StorySection />
      </main>
      <Footer />
    </>
  );
}
