import { useEffect, useState } from "react";

import slide1 from "../assets/slide1.jpeg";
import slide2 from "../assets/slide2.jpeg";
import slide3 from "../assets/slide3.jpeg";
import slide4 from "../assets/slide4.jpeg";

const slides = [
  {
    image: slide1,
    kicker: "ZURI ELEGANCE",
    title: "Luxury Hair. Unmatched Elegance.",
    subtitle: "Premium beauty crafted for confidence.",
  },
  {
    image: slide2,
    kicker: "CURATED BEAUTY",
    title: "Designed For Your Glow.",
    subtitle: "Luxury hair and beauty essentials for your signature look.",
  },
  {
    image: slide3,
    kicker: "TIMELESS STYLE",
    title: "Every Strand, Every Detail.",
    subtitle: "Beauty made elegant, modern and effortless.",
  },
  {
    image: slide4,
    kicker: "ZURI COLLECTION",
    title: "Confidence In Every Look.",
    subtitle: "Curated for beauty. Designed for you.",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5200);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="zuri-hero-slider">
      <style>{css}</style>

      {slides.map((slide, index) => (
        <img
          key={index}
          src={slide.image}
          alt={slide.title}
          className={`zuri-hero-image ${index === current ? "active" : ""}`}
        />
      ))}

      <div className="zuri-hero-overlay" />

      <div className="zuri-hero-text" key={current}>
        <p>{slides[current].kicker}</p>
        <h1>{slides[current].title}</h1>
        <span>{slides[current].subtitle}</span>
      </div>
    </section>
  );
}

const css = `
.zuri-hero-slider {
  width: 100%;
  height: 600px;
  min-height: 520px;
  max-height: 700px;
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.25);
}

.zuri-hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1);
  transition: opacity 1.2s ease-in-out;
}

.zuri-hero-image.active {
  opacity: 1;
  animation: zuriSlowZoom 6s ease-in-out forwards;
}

.zuri-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,0.62), rgba(0,0,0,0.18), rgba(0,0,0,0.40)),
    linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.48));
}

.zuri-hero-text {
  position: absolute;
  left: 46px;
  bottom: 58px;
  max-width: 560px;
  color: white;
  animation: zuriFloatText 1s ease both;
  z-index: 3;
}

.zuri-hero-text p {
  margin: 0 0 12px;
  color: #A38560;
  font-weight: 900;
  letter-spacing: 2.4px;
  font-size: 12px;
}

.zuri-hero-text h1 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: 48px;
  line-height: 0.95;
  font-weight: 900;
  text-shadow: 0 10px 28px rgba(0,0,0,0.42);
}

.zuri-hero-text span {
  display: block;
  margin-top: 16px;
  color: rgba(255,255,255,0.86);
  font-weight: 700;
  line-height: 1.5;
}

@keyframes zuriSlowZoom {
  from { transform: scale(1); }
  to { transform: scale(1.09); }
}

@keyframes zuriFloatText {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .zuri-hero-slider {
    height: 460px;
    min-height: 420px;
    margin-top: 82px;
  }

  .zuri-hero-text {
    left: 24px;
    right: 24px;
    bottom: 34px;
  }

  .zuri-hero-text h1 {
    font-size: 34px;
  }
}
`;
