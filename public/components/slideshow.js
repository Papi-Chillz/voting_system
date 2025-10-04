import React, { useEffect, useState } from "react";
import "./slideshow.css";

const images = [
  "/images/pic1.jpeg",
  "/images/pic2.jpeg",
  "/images/pic3.jpeg",
  "/images/pic4.jpeg",
  "/images/pic5.jpeg",
  "/images/pic6.jpeg"
];

export default function Slideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="bg-slideshow"
      style={{ backgroundImage: `url(${images[current]})` }}
    ></div>
  );
}
