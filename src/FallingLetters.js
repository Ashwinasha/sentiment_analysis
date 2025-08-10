// src/FallingLetters.js
import React, { useEffect, useRef } from 'react';

const FallingLetters = () => {
  const canvasRef = useRef(null);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'; // letters & symbols

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Create an array of letters falling
    const fontSize = 20;
    const columns = Math.floor(width / fontSize);

    const drops = new Array(columns).fill(1); // y position of each column

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // translucent background to create trail effect
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0b79d0'; // color of letters (blueish)
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // pick a random letter or symbol
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        // x position = i * fontSize
        // y position = drops[i] * fontSize
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // reset drop back to top randomly after reaching bottom
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    let animationId;
    const loop = () => {
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none', // let clicks pass through
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export default FallingLetters;
