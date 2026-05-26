import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
  FaCcVisa,
  FaCcMastercard,
  FaCcApplePay,
} from "react-icons/fa6";
import { Link } from "react-router-dom";

export default function LuxeFooter() {
  return (
    <footer className="luxe-footer">
      <style>{css}</style>

      <div className="footer-glow" />

      <div className="footer-brand">
        <h2>Zuri Elegance</h2>
        <p>Luxury hair, beauty essentials and elegance curated for your signature look.</p>

        <div className="social-icons">
          <a href="#" aria-label="Facebook"><FaFacebookF /></a>
          <a href="#" aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="TikTok"><FaTiktok /></a>
          <a href="#" aria-label="X"><FaXTwitter /></a>
          <a href="#" aria-label="YouTube"><FaYoutube /></a>
        </div>
      </div>

      <div className="footer-links">
        <FooterColumn title="Shop" links={[
          ["Products", "/products"],
          ["Wishlist", "/wishlist"],
          ["Cart", "/cart"],
          ["Checkout", "/checkout"],
        ]} />

        <FooterColumn title="Support" links={[
          ["Contact", "/contact"],
          ["Delivery", "/delivery"],
          ["Track Order", "/tracking"],
          ["My Orders", "/orders"],
        ]} />

        <FooterColumn title="Company" links={[
          ["About", "/about"],
          ["Profile", "/profile"],
          ["Create Account", "/register"],
          ["Login", "/login"],
        ]} />

        <FooterColumn title="Legal" links={[
          ["Privacy Policy", "/privacy-policy"],
          ["Terms & Conditions", "/terms-and-conditions"],
          ["Shipping Policy", "/shipping-policy"],
          ["Returns Policy", "/returns-policy"],
        ]} />
      </div>

      <div className="payments">
        <h3>Payments Accepted</h3>
        <div className="payment-icons">
          <span className="paystack">Paystack</span>
          <FaCcVisa className="visa" />
          <FaCcMastercard className="mastercard" />
          <FaCcApplePay className="applepay" />
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Zuri Elegance. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div className="footer-column">
      <h3>{title}</h3>
      {links.map(([label, path]) => (
        <Link key={label} to={path}>{label}</Link>
      ))}
    </div>
  );
}

const css = `
.luxe-footer {
  position: relative;
  margin: 44px 20px 26px;
  padding: 38px;
  border-radius: 34px;
  color: #fff;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(163,133,96,0.28), transparent 32%),
    linear-gradient(135deg, rgba(80,36,42,0.98), rgba(30,12,15,0.98));
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: 0 28px 70px rgba(80,36,42,0.34);
  display: grid;
  grid-template-columns: 1.1fr 2fr 1fr;
  gap: 34px;
}

.luxe-footer:hover {
  transform: translateY(-6px);
  box-shadow: 0 40px 90px rgba(80,36,42,0.45);
}

.footer-glow {
  position: absolute;
  width: 260px;
  height: 260px;
  right: -90px;
  top: -100px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,0.16), transparent 68%);
  pointer-events: none;
}

.footer-brand,
.footer-links,
.payments,
.footer-bottom {
  position: relative;
  z-index: 1;
}

.footer-brand h2 {
  margin: 0;
  color: #A38560;
  font-family: Georgia, serif;
  font-size: 30px;
}

.footer-brand p {
  margin: 10px 0 0;
  color: rgba(255,255,255,0.78);
  line-height: 1.65;
  max-width: 340px;
}

.social-icons {
  display: flex;
  gap: 11px;
  margin-top: 20px;
}

.social-icons a {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #fff;
  text-decoration: none;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.14);
  transition: 0.25s ease;
}

.social-icons a:hover {
  transform: translateY(-4px) scale(1.06);
  background: rgba(163,133,96,0.32);
  box-shadow: 0 0 20px rgba(163,133,96,0.38);
}

.social-icons a:hover svg {
  transform: scale(1.2);
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.footer-column h3,
.payments h3 {
  margin: 0 0 13px;
  color: #A38560;
  font-size: 12px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
}

.footer-column a {
  display: block;
  color: rgba(255,255,255,0.82);
  text-decoration: none;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  transition: 0.2s ease;
}

.footer-column a:hover {
  color: #fff;
  transform: translateX(4px);
}

.payment-icons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.paystack {
  background: #011B33;
  color: #fff;
  padding: 9px 15px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 13px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.18);
}

.payment-icons svg {
  font-size: 38px;
  background: #fff;
  border-radius: 9px;
  padding: 3px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.18);
}

.visa { color: #1A1F71; }
.mastercard { color: #EB001B; }
.applepay { color: #111; }

.footer-bottom {
  grid-column: 1 / -1;
  border-top: 1px solid rgba(255,255,255,0.12);
  padding-top: 18px;
  text-align: center;
  color: rgba(255,255,255,0.68);
  font-size: 13px;
}

.luxe-footer::after {
  content: "";
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.12), transparent);
  animation: shine 6s infinite;
}

@media (max-width: 560px) {
  .luxe-footer {
    margin: 16px 10px 14px;
    padding: 18px 16px 14px;
    border-radius: 18px;
    grid-template-columns: 1fr;
    gap: 14px;
    transform: none !important;
  }

  .luxe-footer:hover {
    transform: none !important;
  }

  .footer-brand h2 {
    font-size: 20px;
    line-height: 1.05;
  }

  .footer-brand p {
    font-size: 10px;
    line-height: 1.35;
    margin-top: 6px;
  }

  .social-icons {
    gap: 7px;
    margin-top: 10px;
  }

  .social-icons a {
    width: 26px;
    height: 26px;
    font-size: 11px;
  }

  .footer-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
  }

  .footer-column h3,
  .payments h3 {
    font-size: 9px;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .footer-column a {
    font-size: 10px;
    line-height: 1.15;
    margin-bottom: 5px;
  }

  .payments {
    margin-top: 0;
  }

  .payment-icons {
    gap: 6px;
  }

  .paystack {
    padding: 6px 9px;
    font-size: 9px;
  }

  .payment-icons svg {
    font-size: 24px;
    border-radius: 6px;
    padding: 2px;
  }

  .footer-bottom {
    padding-top: 10px;
    font-size: 9px;
  }

  .footer-glow {
    width: 140px;
    height: 140px;
    right: -60px;
    top: -60px;
  }
}
`;
