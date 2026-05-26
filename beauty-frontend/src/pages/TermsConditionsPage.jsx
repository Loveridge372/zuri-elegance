
import Navbar from "../components/Navbar";
import {
  FaShieldHalved,
  FaCreditCard,
  FaTruckFast,
  FaBoxOpen,
  FaScaleBalanced,
  FaCircleCheck,
} from "react-icons/fa6";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function TermsConditionsPage() {
  return (
    <>
      <style>{styles}</style>

      <Navbar />

      <main className="terms-page">
        <section className="hero">
          <div className="overlay" />

          <div className="hero-content">
            <p>ZURI ELEGANCE</p>

            <h1>Terms & Conditions</h1>

            <span>
              These terms govern the use of the Zuri Elegance platform,
              purchases, payments, deliveries and customer responsibilities.
            </span>

            <div className="badges">
              <div>
                <FaShieldHalved />
                Secure Shopping
              </div>

              <div>
                <FaTruckFast />
                Nationwide Delivery
              </div>

              <div>
                <FaCreditCard />
                Protected Payments
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="top-card">
            <small>Last Updated: May 2026</small>

            <h2>Welcome To Zuri Elegance</h2>

            <p>
              By accessing or using the Zuri Elegance website, you agree to the
              following terms and conditions. These terms are designed to ensure
              a secure, transparent and premium shopping experience for all
              customers.
            </p>
          </div>

          <div className="grid">
            <div className="card">
              <div className="icon">
                <FaCircleCheck />
              </div>

              <h3>1. Acceptance Of Terms</h3>

              <p>
                By using our website, creating an account or placing an order,
                you agree to comply with these Terms & Conditions.
              </p>
            </div>

            <div className="card">
              <div className="icon">
                <FaBoxOpen />
              </div>

              <h3>2. Products</h3>

              <p>
                We aim to display products, colours and textures as accurately
                as possible. Product appearance may vary slightly depending on
                lighting and device settings.
              </p>
            </div>

            <div className="card">
              <div className="icon">
                <FaCreditCard />
              </div>

              <h3>3. Pricing & Payments</h3>

              <ul>
                <li>All prices are listed in South African Rand (ZAR)</li>
                <li>Prices may change without notice</li>
                <li>Payments are securely processed</li>
                <li>Orders are only confirmed after successful payment</li>
              </ul>
            </div>

            <div className="card">
              <div className="icon">
                <FaTruckFast />
              </div>

              <h3>4. Delivery</h3>

              <ul>
                <li>Delivery times may vary by area</li>
                <li>Tracking is provided where available</li>
                <li>24-hour delivery applies to selected locations</li>
                <li>Customers must provide accurate delivery details</li>
              </ul>
            </div>

            <div className="card">
              <div className="icon">
                <FaScaleBalanced />
              </div>

              <h3>5. Orders & Cancellations</h3>

              <p>
                Zuri Elegance reserves the right to refuse, limit or cancel
                orders where necessary, including suspected fraudulent activity
                or pricing errors.
              </p>
            </div>

            <div className="card">
              <div className="icon">
                <FaShieldHalved />
              </div>

              <h3>6. Governing Law</h3>

              <p>
                These Terms & Conditions are governed by the laws of South
                Africa and comply with applicable consumer protection
                regulations.
              </p>
            </div>
          </div>

          <div className="bottom-card">
            <h2>Customer Responsibility</h2>

            <p>
              Customers are responsible for maintaining the confidentiality of
              their account information and ensuring that all order details are
              accurate before completing checkout.
            </p>

            <div className="highlight">
              Zuri Elegance is committed to providing a secure and luxury online
              shopping experience.
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

.terms-page{
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
    url("/slide2.jpeg");
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

.top-card,
.bottom-card{
  background:white;
  border-radius:30px;
  padding:36px;
  box-shadow:0 20px 50px rgba(80,36,42,.08);
}

.top-card small{
  color:${GOLD};
  font-weight:900;
}

.top-card h2,
.bottom-card h2{
  margin:12px 0;
  font-size:38px;
  color:${WINE};
  font-family:Georgia, serif;
}

.top-card p,
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