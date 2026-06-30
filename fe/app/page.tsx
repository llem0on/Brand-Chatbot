import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedCollection from "@/components/FeaturedCollection";
import CategoryRow from "@/components/CategoryRow";
import NewArrivals from "@/components/NewArrivals";
import BrandStatement from "@/components/BrandStatement";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedCollection />
        <CategoryRow />
        <NewArrivals />
        <BrandStatement />
      </main>
      <Footer />
    </>
  );
}
