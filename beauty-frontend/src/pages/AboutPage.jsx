
import Navbar from "../components/Navbar";
import {
  FaTruckFast,
  FaShieldHalved,
  FaCreditCard,
  FaBoxOpen,
} from "react-icons/fa6";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function AboutPage() {
  return (
    <>
      <style>{styles}</style>

      <Navbar />

      <main className="about-page">
        <section className="about-hero">
          <p>ABOUT ZURI</p>

          <h1>Zuri Elegance</h1>

          <span>
            Zuri Elegance is a luxury online beauty and hair store based in
            South Africa, offering premium wigs, bundles, closures, frontals,
            beauty care products and accessories.
          </span>

          <span>
            Our platform is designed to provide a smooth online shopping
            experience with secure payments, fast order processing, trusted
            nationwide delivery and real-time order tracking.
          </span>

          <div className="about-badges">
            <div><FaBoxOpen /> Luxury Hair & Beauty</div>
            <div><FaCreditCard /> Secure Online Shopping</div>
            <div><FaTruckFast /> Nationwide Delivery</div>
            <div><FaShieldHalved /> Trusted Service</div>
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <h2>Our Mission</h2>
            <p>
              To deliver elegance, confidence and quality with every order,
              while making premium beauty products easier to shop online.
            </p>
          </div>

          <div className="info-card">
            <h2>Delivery Experience</h2>
            <p>
              We focus on reliable delivery, clear order updates and tracking
              support so customers always know what is happening with their
              purchase.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

const styles = `
.about-page {
  min-height: 100vh;
  padding: 110px 30px 60px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 34%),
    #f8f4ee;
}

.about-hero {
  padding: 50px;
  border-radius: 32px;
  background: linear-gradient(135deg, ${WINE}, #1f0f12);
  color: white;
  box-shadow: 0 24px 60px rgba(80,36,42,.18);
}

.about-hero p {
  color: ${GOLD};
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 3px;
  margin: 0;
}

.about-hero h1 {
  margin: 10px 0 20px;
  font-size: 58px;
  font-family: Georgia, serif;
}

.about-hero span {
  display: block;
  max-width: 900px;
  margin-bottom: 18px;
  color: rgba(255,255,255,.85);
  line-height: 1.9;
  font-size: 16px;
}

.about-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.about-badges div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 999px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  font-weight: 800;
}

.about-badges svg {
  color: ${GOLD};
}

.info-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 18px 42px rgba(80,36,42,.10);
}

.info-card h2 {
  color: ${WINE};
  font-family: Georgia, serif;
  font-size: 30px;
  margin-top: 0;
}

.info-card p {
  color: #6f6467;
  line-height: 1.8;
}

@media(max-width: 900px) {
  .about-page {
    padding: 95px 18px 40px;
  }

  .about-hero {
    padding: 30px;
  }

  .about-hero h1 {
    font-size: 42px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
`;