
import Navbar from "../components/Navbar";
import {
  FaArrowRotateLeft,
  FaBoxOpen,
  FaTriangleExclamation,
  FaMoneyBillWave,
  FaShuffle,
  FaShieldHalved,
} from "react-icons/fa6";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function ReturnsPolicyPage() {
  return (
    <>
      <style>{styles}</style>

      <Navbar />

      <main className="returns-page">
        <section className="hero">
          <div className="overlay" />

          <div className="hero-content">
            <p>ZURI ELEGANCE</p>

            <h1>Returns Policy</h1>

            <span>
              Our returns policy is designed to ensure fairness, hygiene
              protection and customer satisfaction while maintaining luxury
              product standards.
            </span>

            <div className="badges">
              <div>
                <FaShieldHalved />
                Secure Orders
              </div>

              <div>
                <FaArrowRotateLeft />
                Easy Returns
              </div>

              <div>
                <FaMoneyBillWave />
                Protected Payments
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="intro-card">
            <small>Last Updated: May 2026</small>

            <h2>Returns & Refund Information</h2>

            <p>
              At Zuri Elegance, customer satisfaction is important to us.
              Because we sell beauty and hair products, certain hygiene and
              safety conditions apply to returns and exchanges.
            </p>
          </div>

          <div className="grid">
            <div className="card">
              <div className="icon">
                <FaArrowRotateLeft />
              </div>

              <h3>1. Eligibility For Returns</h3>

              <ul>
                <li>Items must be unused and unworn</li>
                <li>Products must remain in original packaging</li>
                <li>Return requests must be made within 7 days</li>
                <li>Proof of purchase is required</li>
              </ul>
            </div>

            <div className="card">
              <div className="icon">
                <FaBoxOpen />
              </div>

              <h3>2. Non-Returnable Items</h3>

              <ul>
                <li>Opened beauty products</li>
                <li>Installed wigs or hairpieces</li>
                <li>Customised products</li>
                <li>Sale or clearance items</li>
              </ul>
            </div>

            <div className="card">
              <div className="icon">
                <FaTriangleExclamation />
              </div>

              <h3>3. Damaged Or Incorrect Orders</h3>

              <p>
                If your item arrives damaged, defective or incorrect, contact
                us within 48 hours and include clear photos together with your
                order number.
              </p>
            </div>

            <div className="card">
              <div className="icon">
                <FaMoneyBillWave />
              </div>

              <h3>4. Refunds</h3>

              <p>
                Approved refunds are processed back to the original payment
                method within 5–10 business days. Delivery fees are generally
                non-refundable unless the issue was caused by Zuri Elegance.
              </p>
            </div>

            <div className="card">
              <div className="icon">
                <FaShuffle />
              </div>

              <h3>5. Exchanges</h3>

              <p>
                Exchanges are subject to stock availability. If the requested
                item is unavailable, store credit or a refund may be offered.
              </p>
            </div>

            <div className="card">
              <div className="icon">
                <FaShieldHalved />
              </div>

              <h3>6. Customer Protection</h3>

              <p>
                Zuri Elegance follows fair consumer practices and complies with
                South African consumer protection regulations.
              </p>
            </div>
          </div>

          <div className="bottom-card">
            <h2>Need Help With A Return?</h2>

            <p>
              Contact our support team with your order number and return
              request. Our team will guide you through the process as quickly
              as possible.
            </p>

            <div className="highlight">
              Luxury customer care and secure shopping are part of the Zuri
              Elegance experience.
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const styles = `
*{
  box-sizing:border-box;
}

body{
  margin:0;
  background:#f8f4ee;
}

.returns-page{
  min-height:100vh;
  background:#f8f4ee;
}

.hero{
  position:relative;
  min-height:420px;
  display:flex;
  align-items:center;
  padding:120px 8%;
  overflow:hidden;
  background:
    linear-gradient(rgba(20,8,10,.72), rgba(20,8,10,.72)),
    url("/slide3.jpeg");
  background-size:cover;
  background-position:center;
}

.overlay{
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 30%);
}

.hero-content{
  position:relative;
  z-index:2;
  max-width:760px;
  color:white;
}

.hero-content p{
  color:${GOLD};
  font-size:13px;
  font-weight:900;
  letter-spacing:3px;
}

.hero-content h1{
  margin:10px 0;
  font-size:72px;
  line-height:.95;
  font-family:Georgia, serif;
}

.hero-content span{
  display:block;
  margin-top:20px;
  max-width:620px;
  color:rgba(255,255,255,.82);
  line-height:1.8;
  font-size:16px;
}

.badges{
  display:flex;
  flex-wrap:wrap;
  gap:14px;
  margin-top:28px;
}

.badges div{
  display:flex;
  align-items:center;
  gap:10px;
  padding:14px 18px;
  border-radius:999px;
  background:rgba(255,255,255,.12);
  border:1px solid rgba(255,255,255,.18);
  backdrop-filter:blur(12px);
  font-weight:800;
}

.content{
  width:min(1300px,92%);
  margin:auto;
  padding:40px 0 70px;
}

.intro-card,
.bottom-card{
  background:white;
  border-radius:30px;
  padding:36px;
  box-shadow:0 20px 50px rgba(80,36,42,.08);
}

.intro-card small{
  color:${GOLD};
  font-weight:900;
}

.intro-card h2,
.bottom-card h2{
  margin:12px 0;
  font-size:38px;
  color:${WINE};
  font-family:Georgia, serif;
}

.intro-card p,
.bottom-card p{
  color:#6f6467;
  line-height:1.8;
}

.grid{
  margin:24px 0;
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:20px;
}

.card{
  background:white;
  border-radius:28px;
  padding:30px;
  box-shadow:0 20px 50px rgba(80,36,42,.06);
}

.icon{
  width:58px;
  height:58px;
  border-radius:18px;
  display:grid;
  place-items:center;
  background:${WINE};
  color:${GOLD};
  font-size:22px;
  margin-bottom:18px;
}

.card h3{
  margin:0 0 14px;
  color:${WINE};
  font-size:25px;
}

.card p,
.card li{
  color:#6f6467;
  line-height:1.8;
}

.card ul{
  padding-left:18px;
}

.highlight{
  margin-top:20px;
  padding:20px;
  border-radius:22px;
  background:linear-gradient(135deg, ${WINE}, #1f0f12);
  color:white;
  font-weight:800;
}

@media(max-width:900px){

  .hero{
    min-height:auto;
    padding:110px 24px 70px;
  }

  .hero-content h1{
    font-size:52px;
  }

  .grid{
    grid-template-columns:1fr;
  }
}
`;