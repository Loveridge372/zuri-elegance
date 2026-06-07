import { FaApple, FaGooglePlay } from "react-icons/fa6";
import { SiHuawei } from "react-icons/si";

const stores = [
  {
    name: "Google Play",
    eyebrow: "Get it on",
    Icon: FaGooglePlay,
  },
  {
    name: "App Store",
    eyebrow: "Download on the",
    Icon: FaApple,
  },
  {
    name: "Huawei AppGallery",
    eyebrow: "Explore it on",
    Icon: SiHuawei,
  },
];

export default function AppDownloadBand() {
  return (
    <section className="app-download-band" aria-labelledby="app-download-title">
      <style>{css}</style>

      <div className="app-download-copy">
        <span>Mobile App</span>
        <h2 id="app-download-title">Shop Zuri Elegance from your phone.</h2>
        <p>
          Enjoy beauty shopping, wishlist, cart, rewards, AI Beauty Match and order updates from the Zuri Elegance mobile app.
        </p>
      </div>

      <div className="app-store-badges" aria-label="Zuri Elegance app stores">
        {stores.map(({ name, eyebrow, Icon }) => (
          <div className="app-store-badge" key={name}>
            <Icon aria-hidden="true" />
            <span>
              <small>{eyebrow}</small>
              <strong>{name}</strong>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

const css = `
.app-download-band {
  margin: 48px 20px -18px;
  padding: 26px 30px;
  border-radius: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  align-items: center;
  gap: 24px;
  background:
    radial-gradient(circle at 12% 18%, rgba(196,162,106,.26), transparent 28%),
    linear-gradient(135deg, #fffaf5, #f2e6d7);
  border: 1px solid rgba(80,36,42,.10);
  box-shadow: 0 22px 50px rgba(80,36,42,.12);
}

.app-download-copy span {
  display: inline-flex;
  margin-bottom: 8px;
  color: #A38560;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.app-download-copy h2 {
  margin: 0;
  color: #50242A;
  font-family: Georgia, serif;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1;
}

.app-download-copy p {
  max-width: 640px;
  margin: 12px 0 0;
  color: #6d5d60;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.65;
}

.app-store-badges {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.app-store-badge {
  min-height: 66px;
  padding: 10px 15px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 13px;
  color: #fff;
  background: linear-gradient(135deg, #50242A, #2b1114);
  border: 1px solid rgba(255,255,255,.12);
  box-shadow: 0 14px 26px rgba(80,36,42,.22);
}

.app-store-badge svg {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  color: #C4A26A;
}

.app-store-badge span {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
}

.app-store-badge small {
  color: rgba(255,255,255,.72);
  font-size: 11px;
  font-weight: 800;
}

.app-store-badge strong {
  margin-top: 4px;
  color: #fff;
  font-size: 18px;
  font-weight: 950;
}

@media (max-width: 768px) {
  .app-download-band {
    margin: 30px 12px -6px;
    padding: 20px 16px;
    border-radius: 24px;
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .app-download-copy h2 {
    font-size: 30px;
  }

  .app-download-copy p {
    font-size: 13px;
    line-height: 1.5;
  }

  .app-store-badge {
    min-height: 58px;
    border-radius: 16px;
  }

  .app-store-badge svg {
    width: 26px;
    height: 26px;
  }

  .app-store-badge strong {
    font-size: 15px;
  }
}
`;
