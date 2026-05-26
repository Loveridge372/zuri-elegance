import Navbar from "../components/Navbar";
import Seo from "../components/Seo";

export default function ContactPage() {
  return (
    <>
      <Navbar toggleSidebar={() => {}} />
      <Seo
        title="Contact Zuri Elegance"
        description="Contact Zuri Elegance by email for help with orders, delivery, products and returns."
      />
      <main className="contact-page">
        <style>{css}</style>
        <section className="contact-card">
          <p>CONTACT ZURI</p>
          <h1>Contact Us</h1>
          <a href="mailto:support@zurielegance.co.za">support@zurielegance.co.za</a>
          <span>We are here to help with orders, delivery, products and returns.</span>
        </section>
      </main>
    </>
  );
}

const css = `
.contact-page {
  min-height: 100vh;
  padding: 120px 20px 44px;
  background:
    radial-gradient(circle at top right, rgba(163,133,96,.18), transparent 32%),
    linear-gradient(180deg, #fbf7f1, #f8f4ee);
  font-family: Inter, Arial, sans-serif;
}

.contact-card {
  max-width: 760px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid rgba(80,36,42,.08);
  border-radius: 24px;
  padding: 36px;
  box-shadow: 0 18px 42px rgba(80,36,42,.10);
  color: #2b2023;
}

.contact-card p {
  margin: 0;
  color: #A38560;
  font-weight: 900;
  letter-spacing: 2px;
  font-size: 12px;
}

.contact-card h1 {
  margin: 10px 0 18px;
  color: #50242A;
  font-family: Georgia, serif;
  font-size: 40px;
}

.contact-card a {
  display: inline-flex;
  color: #07332c;
  font-size: 20px;
  font-weight: 900;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.contact-card a:hover {
  color: #A38560;
}

.contact-card span {
  display: block;
  margin-top: 16px;
  color: #75686a;
  font-weight: 800;
  line-height: 1.6;
}

@media (max-width: 700px) {
  .contact-page {
    padding: 88px 12px 28px;
  }

  .contact-card {
    padding: 26px 18px;
  }

  .contact-card h1 {
    font-size: 34px;
  }
}
`;
