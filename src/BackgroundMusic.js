// src/BackgroundMusic.js
import { useEffect, useRef } from "react";
import { Howl } from "howler";
import musicaPrincipal from "./assets/sounds/musica-principal.mp3";

export default function BackgroundMusic({ play }) {
  const soundRef = useRef(null);

  useEffect(() => {
    if (!soundRef.current) {
      soundRef.current = new Howl({
        src: [musicaPrincipal],
        loop: true,
        volume: 0.5,
        html5: true,
      });
    }

    if (play) {
      if (!soundRef.current.playing()) {
        soundRef.current.play();
      }
    } else {
      soundRef.current.stop();
    }
  }, [play]);

  return null;
}
