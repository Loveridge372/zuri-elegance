
import {
  FaShieldHalved,
  FaLock,
  FaTruckFast,
  FaCreditCard,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa6";

import LuxeFooter from "../components/LuxeFooter";

const WINE = "#50242A";
const GOLD = "#A38560";

export default function PrivacyPolicyPage() {
  return (
    <>
      <style>{styles}</style>

      <main className="privacy-page">
        <section className="hero">
          <div className="hero-overlay" />

          <div className="hero-content">
            <p>ZURI ELEGANCE</p>
            <h1>Privacy Policy</h1>

            <span>
              Your privacy, payment security and personal information matter to
              us. This policy explains how we collect, use and protect your
              data in line with South African POPIA regulations.
            </span>

            <div className="hero-badges">
              <div>
                <FaShieldHalved />
                POPIA Protected
              </div>

              <div>
                <FaLock />
                Secure Payments
              </div>

              <div>
                <FaTruckFast />
                Trusted Delivery
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="policy-card">
            <small>Last updated: May 2026</small>

            <h2>POPIA Compliance</h2>

            <p>
              Zuri Elegance respects your privacy and protects your personal
              information in accordance with South Africa’s Protection of
              Personal Information Act (POPIA).
            </p>
          </div>

          <div className="grid">
            <div className="info-card">
              <h3>1. Information We Collect</h3>

              <p>
                We may collect:
              </p>

              <ul>
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Delivery address</li>
                <li>Payment references</li>
                <li>Order history</li>
                <li>Wishlist and cart activity</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>2. How We Use Your Information</h3>

              <ul>
                <li>Process and deliver orders</li>
                <li>Verify payments securely</li>
                <li>Provide customer support</li>
                <li>Improve our services</li>
                <li>Send delivery and tracking updates</li>
                <li>Prevent fraud and unauthorized activity</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>3. Sharing Of Information</h3>

              <p>
                We never sell your personal information.
              </p>

              <p>
                Information may only be shared with:
              </p>

              <ul>
                <li>Secure payment providers</li>
                <li>Delivery partners</li>
                <li>Fraud prevention services</li>
                <li>Legal authorities where required by law</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>4. Payment Security</h3>

              <div className="security-box">
                <FaCreditCard />

                <div>
                  <strong>Secure Checkout</strong>

                  <p>
                    Payments are securely processed through Paystack and trusted
                    payment providers. Zuri Elegance does not store full card
                    details on our servers.
                  </p>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>5. Your Rights</h3>

              <ul>
                <li>Request access to your information</li>
                <li>Request correction of incorrect data</li>
                <li>Request deletion of your information</li>
                <li>Withdraw marketing consent</li>
                <li>Request account closure</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>6. Delivery & Orders</h3>

              <ul>
                <li>Orders are processed after successful payment</li>
                <li>Tracking details are provided where available</li>
                <li>Delivery timelines may vary by location</li>
                <li>Customers receive order status updates</li>
              </ul>
            </div>
          </div>

          <div className="contact-card">
            <h2>Contact Us</h2>

            <p>
              If you have questions regarding this privacy policy or your
              personal information, please contact us.
            </p>

            <div className="contact-grid">
              <div>
                <FaEnvelope />
                <span>privacy@zurielegance.co.za</span>
              </div>

              <div>
                <FaPhone />
                <span>+27 South Africa Support</span>
              </div>
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

.privacy-page{
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
    linear-gradient(rgba(20,8,10,.70), rgba(20,8,10,.70)),
    url("/slide1.jpeg");
  background-size:cover;
  background-position:center;
}

.hero-overlay{
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.22), transparent 28%);
}

.hero-content{
  position:relative;
  z-index:2;
  max-width:760px;
  color:white;
}

.hero-content p{
  color:${GOLD};
  letter-spacing:3px;
  font-size:13px;
  font-weight:900;
}

.hero-content h1{
  margin:10px 0;
  font-size:72px;
  line-height:.95;
  font-family:Georgia, serif;
}

.hero-content span{
  display:block;
  max-width:640px;
  margin-top:20px;
  color:rgba(255,255,255,.82);
  line-height:1.8;
  font-size:16px;
}

.hero-badges{
  display:flex;
  flex-wrap:wrap;
  gap:14px;
  margin-top:28px;
}

.hero-badges div{
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

.policy-card,
.contact-card{
  background:white;
  border-radius:30px;
  padding:34px;
  box-shadow:0 20px 50px rgba(80,36,42,.08);
}

.policy-card small{
  color:${GOLD};
  font-weight:900;
}

.policy-card h2,
.contact-card h2{
  margin:12px 0;
  font-size:38px;
  color:${WINE};
  font-family:Georgia, serif;
}

.policy-card p,
.contact-card p{
  color:#6f6467;
  line-height:1.8;
}

.grid{
  margin-top:24px;
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:20px;
}

.info-card{
  background:white;
  border-radius:28px;
  padding:28px;
  box-shadow:0 20px 50px rgba(80,36,42,.06);
}

.info-card h3{
  margin-top:0;
  color:${WINE};
  font-size:24px;
}

.info-card p,
.info-card li{
  color:#6f6467;
  line-height:1.7;
}

.info-card ul{
  padding-left:18px;
}

.security-box{
  display:flex;
  gap:16px;
  margin-top:14px;
  padding:20px;
  border-radius:22px;
  background:#f8f4ee;
}

.security-box svg{
  color:${GOLD};
  font-size:26px;
  flex-shrink:0;
}

.contact-card{
  margin-top:24px;
}

.contact-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:18px;
  margin-top:24px;
}

.contact-grid div{
  display:flex;
  align-items:center;
  gap:14px;
  padding:18px;
  border-radius:20px;
  background:#f8f4ee;
  font-weight:800;
  color:${WINE};
}

.contact-grid svg{
  color:${GOLD};
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

  .contact-grid{
    grid-template-columns:1fr;
  }
}
`;