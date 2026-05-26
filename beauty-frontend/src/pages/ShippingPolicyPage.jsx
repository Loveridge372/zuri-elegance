
import Navbar from "../components/Navbar";
import {
  FaTruckFast,
  FaLocationDot,
  FaClock,
  FaMoneyBillWave,
  FaRoute,
  FaCircleInfo,
} from "react-icons/fa6";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function ShippingPolicyPage() {
  return (
    <>
      <style>{styles}</style>

      <Navbar />

      <main className="shipping-page">
        <section className="hero">
          <div className="overlay" />

          <div className="hero-content">
            <p>ZURI ELEGANCE</p>
            <h1>Shipping Policy</h1>

            <span>
              We aim to deliver your Zuri Elegance order safely, beautifully and
              as quickly as possible across South Africa.
            </span>

            <div className="badges">
              <div><FaTruckFast /> Fast Delivery</div>
              <div><FaRoute /> Tracking Updates</div>
              <div><FaLocationDot /> South Africa</div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="intro-card">
            <small>Last Updated: May 2026</small>
            <h2>Delivery Information</h2>
            <p>
              Orders are processed after successful payment confirmation. We do
              our best to prepare and dispatch every order quickly while keeping
              your products protected and professionally packaged.
            </p>
          </div>

          <div className="grid">
            <PolicyCard
              icon={<FaLocationDot />}
              title="1. Shipping Areas"
              text="Zuri Elegance currently ships throughout South Africa. Delivery availability and timeframes may vary depending on your area."
            />

            <PolicyCard
              icon={<FaClock />}
              title="2. Processing Times"
              text="Orders are usually processed within 1–3 business days after payment confirmation. Orders placed on weekends or public holidays may be processed on the next business day."
            />

            <PolicyCard
              icon={<FaTruckFast />}
              title="3. Delivery Times"
              text="Cape Town and Johannesburg may qualify for faster delivery where available. Major cities usually take 2–4 business days. Remote areas may take 3–7 business days."
            />

            <PolicyCard
              icon={<FaMoneyBillWave />}
              title="4. Shipping Costs"
              text="A standard delivery fee may be added at checkout. Delivery fees are shown before payment is completed."
            />

            <PolicyCard
              icon={<FaRoute />}
              title="5. Tracking"
              text="Where available, customers receive a tracking number after payment confirmation. You can use the tracking page to follow your delivery status."
            />

            <PolicyCard
              icon={<FaCircleInfo />}
              title="6. Incorrect Delivery Details"
              text="Customers are responsible for entering the correct delivery address and contact number. Incorrect details may delay delivery."
            />
          </div>

          <div className="bottom-card">
            <h2>Important Delivery Notes</h2>

            <ul>
              <li>Delivery timelines are estimates and may be affected by courier delays.</li>
              <li>Orders are dispatched only after successful payment verification.</li>
              <li>Someone may need to be available to receive the parcel.</li>
              <li>Zuri Elegance is not responsible for delays caused by incorrect customer details.</li>
            </ul>

            <div className="highlight">
              Need help with your order? Use your order reference or tracking
              number on the Track Order page.
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function PolicyCard({ icon, title, text }) {
  return (
    <div className="card">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f8f4ee;
}

.shipping-page {
  min-height: 100vh;
  background: #f8f4ee;
}

.hero {
  position: relative;
  min-height: 420px;
  display: flex;
  align-items: center;
  padding: 120px 8%;
  overflow: hidden;
  background:
    linear-gradient(rgba(20,8,10,.72), rgba(20,8,10,.72)),
    url("/slide4.jpeg");
  background-size: cover;
  background-position: center;
}

.overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 30%);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 760px;
  color: white;
}

.hero-content p {
  color: ${GOLD};
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 3px;
}

.hero-content h1 {
  margin: 10px 0;
  font-size: 72px;
  line-height: .95;
  font-family: Georgia, serif;
}

.hero-content span {
  display: block;
  margin-top: 20px;
  max-width: 620px;
  color: rgba(255,255,255,.82);
  line-height: 1.8;
  font-size: 16px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.badges div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 999px;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(12px);
  font-weight: 800;
}

.content {
  width: min(1300px, 92%);
  margin: auto;
  padding: 40px 0 70px;
}

.intro-card,
.bottom-card {
  background: white;
  border-radius: 30px;
  padding: 36px;
  box-shadow: 0 20px 50px rgba(80,36,42,.08);
}

.intro-card small {
  color: ${GOLD};
  font-weight: 900;
}

.intro-card h2,
.bottom-card h2 {
  margin: 12px 0;
  font-size: 38px;
  color: ${WINE};
  font-family: Georgia, serif;
}

.intro-card p,
.bottom-card p,
.bottom-card li {
  color: #6f6467;
  line-height: 1.8;
}

.grid {
  margin: 24px 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card {
  background: white;
  border-radius: 28px;
  padding: 30px;
  box-shadow: 0 20px 50px rgba(80,36,42,.06);
}

.icon {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: ${WINE};
  color: ${GOLD};
  font-size: 22px;
  margin-bottom: 18px;
}

.card h3 {
  margin: 0 0 14px;
  color: ${WINE};
  font-size: 25px;
}

.card p {
  color: #6f6467;
  line-height: 1.8;
}

.highlight {
  margin-top: 20px;
  padding: 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, ${WINE}, #1f0f12);
  color: white;
  font-weight: 800;
}

@media(max-width:900px) {
  .hero {
    min-height: auto;
    padding: 110px 24px 70px;
  }

  .hero-content h1 {
    font-size: 52px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
`;