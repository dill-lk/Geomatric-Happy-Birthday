"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWindowSize } from '../lib/useWindowSize';
import { WishLantern } from './WishLantern';

/**
 * 💎 Geometric Birthday Masterpiece
 * Property of Zen Technologies
 * Created by Dill (https://dill.is-a.dev)
 */

interface ShapeResult {
    score: number;
    color: { r: number, g: number, b: number, a: number };
    shapeType: string;
    shapeData: number[];
}

export default function GeometrizeApp() {
    const [giftOpened, setGiftOpened] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [finished, setFinished] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const IMAGE_PATH = '/websites/asset.png';
    const TARGET_SHAPES = 5000;
    const SHAPE_OPACITY = 96;
    const MUTATIONS = 200;
    const BATCH_SIZE = 10;
    const MESSAGE = "Happy Birthday!";
    const SUB_MESSAGE = "You caused so many problems last year 🤌🤌 Happy birthday, pissi! And I'm sure you'll keep causing plenty more, and we'll be here trying to solve them 😎. May you live long, Malindu's Queen, and may your King stay by your side—wishing your relationship lasts forever. From your BF's professional problem-maker 😏";

    const AUDIO_URL = "https://www.chosic.com/wp-content/uploads/2021/04/Happy-Birthday-To-You-Instrumental.mp3";

    const [shapeCount, setShapeCount] = useState(0);
    const [progress, setProgress] = useState(0);
    const [typedText, setTypedText] = useState("");
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const workerRef = useRef<Worker | null>(null);
    const resultCanvasRef = useRef<HTMLCanvasElement>(null);
    const backupCanvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const scratchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const [displaySize, setDisplaySize] = useState({ w: 300, h: 300 });

    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/geometrize.worker.ts', import.meta.url));
        workerRef.current.onmessage = (e) => {
            const { type, data } = e.data;
            if (type === "init_result") {
                setIsRunning(true);
            } else if (type === "step_result") {
                const newShapes = data as ShapeResult[];
                const canvas = resultCanvasRef.current;
                const ctx = canvas?.getContext('2d');
                if (canvas && ctx) {
                    newShapes.forEach(s => drawShape(ctx, s));
                    setShapeCount(prev => {
                        const newCount = prev + newShapes.length;
                        setProgress((newCount / TARGET_SHAPES) * 100);
                        return newCount;
                    });
                }
            }
        };
        return () => workerRef.current?.terminate();
    }, [TARGET_SHAPES]);

    useEffect(() => {
        const img = new Image();
        img.src = IMAGE_PATH;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
        };
    }, [IMAGE_PATH]);

    useEffect(() => {
        if (!windowWidth || !windowHeight || !imageLoaded || !imageRef.current) return;
        const img = imageRef.current;
        const isMobile = windowWidth < 768;
        const marginW = isMobile ? 30 : 160;
        const marginH = isMobile ? 250 : 220;
        const maxWidth = windowWidth - marginW;
        const maxHeight = windowHeight - marginH;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const ratio = w / h;
        if (w > maxWidth) { w = maxWidth; h = w / ratio; }
        if (h > maxHeight) { h = maxHeight; w = h * ratio; }
        setDisplaySize({ w: Math.floor(w), h: Math.floor(h) });
    }, [windowWidth, windowHeight, imageLoaded]);

    useEffect(() => {
        if (progress >= 0 && typedText.length < SUB_MESSAGE.length) {
            const timeout = setTimeout(() => {
                setTypedText(SUB_MESSAGE.slice(0, typedText.length + 1));
            }, 30);
            return () => clearTimeout(timeout);
        }
    }, [progress, typedText, SUB_MESSAGE]);

    useEffect(() => {
        const handleTilt = (e: MouseEvent | TouchEvent) => {
            if (!finished) return;
            let cx, cy;
            if ('touches' in e) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
            else { cx = (e as MouseEvent).clientX; cy = (e as MouseEvent).clientY; }
            setTilt({ x: (cy / window.innerHeight - 0.5) * -10, y: (cx / window.innerWidth - 0.5) * 10 });
        };
        window.addEventListener('mousemove', handleTilt); window.addEventListener('touchmove', handleTilt);
        return () => { window.removeEventListener('mousemove', handleTilt); window.removeEventListener('touchmove', handleTilt); };
    }, [finished]);

    const openGift = () => {
        if (giftOpened || !imageRef.current) return;
        const img = imageRef.current;
        const canvas = resultCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        setGiftOpened(true);

        if (canvas && ctx) {
            const MAX_WORKER_RES = 300;
            let workerW = img.naturalWidth;
            let workerH = img.naturalHeight;
            const ratio = workerW / workerH;
            if (workerW > MAX_WORKER_RES) {
                workerW = MAX_WORKER_RES;
                workerH = workerW / ratio;
            }
            canvas.width = Math.floor(workerW);
            canvas.height = Math.floor(workerH);
            const proxy = document.createElement('canvas');
            proxy.width = 1; proxy.height = 1;
            proxy.getContext('2d')?.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = proxy.getContext('2d')?.getImageData(0, 0, 1, 1).data || [0, 0, 0];
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setInitialized(true);
            const tCanvas = document.createElement('canvas');
            tCanvas.width = canvas.width; tCanvas.height = canvas.height;
            tCanvas.getContext('2d')?.drawImage(img, 0, 0, tCanvas.width, tCanvas.height);
            const imageData = tCanvas.getContext('2d')?.getImageData(0, 0, tCanvas.width, tCanvas.height);
            if (imageData) {
                workerRef.current?.postMessage({
                    type: "init",
                    data: { width: tCanvas.width, height: tCanvas.height, pixels: imageData.data }
                }, [imageData.data.buffer]);
            }
        }
        if (audioRef.current) { audioRef.current.volume = 0.4; audioRef.current.play().catch(() => { }); }
    };

    const drawShape = (ctx: CanvasRenderingContext2D, s: ShapeResult) => {
        const { color, shapeType, shapeData } = s;
        ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${color.a / 255})`;
        ctx.beginPath();
        if (shapeType === "Rectangle") {
            const [x1, y1, x2, y2] = shapeData;
            ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        } else if (shapeType === "RotatedRectangle") {
            const [x, y, w, h, angle] = shapeData;
            ctx.save(); ctx.translate(x, y); ctx.rotate(angle * (Math.PI / 180));
            ctx.rect(-w / 2, -h / 2, w, h); ctx.restore();
        } else if (shapeType === "Ellipse") {
            const [x, y, rx, ry] = shapeData;
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        } else if (shapeType === "RotatedEllipse") {
            const [x, y, rx, ry, angle] = shapeData;
            ctx.ellipse(x, y, rx, ry, angle * (Math.PI / 180), 0, Math.PI * 2);
        } else if (shapeType === "Triangle") {
            const [x1, y1, x2, y2, x3, y3] = shapeData;
            ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath();
        }
        ctx.fill();
    };

    const step = useCallback(() => {
        if (!isRunning) return;
        if (shapeCount >= TARGET_SHAPES) {
            setIsRunning(false); setFinished(true);
            const main = resultCanvasRef.current;
            if (main) {
                const backup = document.createElement('canvas');
                backup.width = main.width; backup.height = main.height;
                backup.getContext('2d')?.drawImage(main, 0, 0);
                backupCanvasRef.current = backup;
            }
            return;
        }
        workerRef.current?.postMessage({
            type: "step",
            data: {
                shapeTypes: ["RotatedEllipse", "Triangle", "RotatedRectangle", "RotatedEllipse"],
                alpha: SHAPE_OPACITY, mutations: MUTATIONS, count: BATCH_SIZE
            }
        });
    }, [isRunning, shapeCount, TARGET_SHAPES, SHAPE_OPACITY, MUTATIONS, BATCH_SIZE]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) interval = setInterval(step, 0);
        return () => clearInterval(interval);
    }, [isRunning, step]);

    const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (!finished) return;
        const canvas = resultCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let cx, cy;
        if ('touches' in e) { cx = e.touches[0].clientX - rect.left; cy = e.touches[0].clientY - rect.top; }
        else { cx = (e as React.MouseEvent).clientX - rect.left; cy = (e as React.MouseEvent).clientY - rect.top; }
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(cx * scaleX, cy * scaleY, 40, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            if (scratchTimeoutRef.current) clearTimeout(scratchTimeoutRef.current);
            scratchTimeoutRef.current = setTimeout(() => {
                if (backupCanvasRef.current) resultCanvasRef.current?.getContext('2d')?.drawImage(backupCanvasRef.current, 0, 0);
            }, 1200);
        }
    };

    const saveMemory = () => {
        const sourceCanvas = backupCanvasRef.current || resultCanvasRef.current;
        if (!sourceCanvas) return;
        const img = imageRef.current;
        if (!img) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(sourceCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
            const x = tempCanvas.width / 2;
            const maxWidth = tempCanvas.width * 0.9;

            // Scaled Font Sizes
            const fontSize = Math.floor(tempCanvas.width * 0.09);
            const subFontSize = Math.floor(tempCanvas.width * 0.03);
            const padding = tempCanvas.height * 0.05;

            // 1. Prepare Sub Message
            ctx.font = `500 ${subFontSize}px "Montserrat", sans-serif`;
            const words = SUB_MESSAGE.split(' ');
            const lines: string[] = []; let currentLine = '';
            for (let n = 0; n < words.length; n++) {
                const testLine = currentLine + words[n] + ' ';
                if (ctx.measureText(testLine).width > maxWidth && n > 0) { lines.push(currentLine); currentLine = words[n] + ' '; }
                else { currentLine = testLine; }
            }
            lines.push(currentLine);

            // 2. Position from Bottom Up
            const lineSpacing = subFontSize * 1.4;
            const totalSubHeight = lines.length * lineSpacing;
            let currentY = tempCanvas.height - padding - totalSubHeight;

            // Draw Lines
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.shadowBlur = 10; ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.fillStyle = "white";
            lines.forEach((l) => { ctx.fillText(l, x, currentY); currentY += lineSpacing; });

            // 3. Position Title above Sub Message
            const titleY = tempCanvas.height - padding - totalSubHeight - fontSize - 20;
            ctx.font = `bold ${fontSize}px "Dancing Script", cursive`;
            ctx.shadowColor = "#FF00DE"; ctx.shadowBlur = 30; ctx.fillStyle = "#FFD700";
            ctx.fillText(MESSAGE, x, titleY);

            const link = document.createElement('a');
            link.download = 'birthday-memory.png';
            link.href = tempCanvas.toDataURL('image/png');
            link.click();
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-black overflow-hidden font-sans touch-none select-none">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Montserrat:wght@300;500;600&display=swap');
                @keyframes shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
                @keyframes popOpen { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
                .gift-box-body { width: 120px; height: 120px; background: linear-gradient(135deg, #6b21a8, #4c1d95); border-radius: 8px; position: relative; }
                .gift-box-lid { width: 130px; height: 30px; background: #7c3aed; border-radius: 4px; position: absolute; top: -25px; left: -5px; }
                .gift-ribbon-v { width: 20px; height: 100%; background: #ffd700; position: absolute; left: 50%; transform: translateX(-100%); }
                .gift-ribbon-h { width: 100%; height: 20px; background: #ffd700; position: absolute; top: 50%; transform: translateY(-50%); }
                .gift-container.opened .gift-box-lid { transform: translateY(-150px) rotate(-20deg); opacity: 0; transition: all 0.5s ease-in; }
                .gift-container.opened .gift-box-body { transform: scale(1.5); opacity: 0; transition: all 0.5s ease-out; }
                .gift-container:not(.opened) { animation: shake 1.5s infinite ease-in-out; }
                .pop-char { display: inline-block; animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }
                @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
            `}</style>

            <audio ref={audioRef} src={AUDIO_URL} loop />
            <InteractiveTrail />

            {!initialized && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black">
                    <div className={`gift-container relative cursor-pointer ${giftOpened ? 'opened' : ''}`} onClick={openGift}>
                        <div className="gift-box-body shadow-2xl">
                            <div className="gift-ribbon-v" /><div className="gift-ribbon-h" />
                            <div className="gift-box-lid shadow-lg"><div className="gift-ribbon-v" style={{ height: '30px' }} /></div>
                        </div>
                    </div>
                    {!giftOpened && <p className="text-white/40 mt-16 animate-pulse text-sm tracking-[0.3em] uppercase">Tap to Unwrap</p>}
                </div>
            )}

            <div
                className={`absolute transition-all duration-300 ${initialized ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    width: displaySize.w, height: displaySize.h, zIndex: 0, top: '40%', left: '50%',
                    transform: `translate(-50%, -50%) perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transformStyle: 'preserve-3d'
                }}
            >
                <img src={IMAGE_PATH} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute' }} />

                <canvas ref={resultCanvasRef}
                    className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 shadow-2xl rounded-lg ${finished ? 'cursor-pointer' : ''} ${initialized ? 'opacity-100' : 'opacity-0'}`}
                    style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)', touchAction: 'none', backfaceVisibility: 'hidden' }} />
            </div>

            {progress > 0 && !finished && initialized && (
                <div className="absolute top-4 mx-4 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-xl z-20 animate-pulse text-white/90 text-xs md:text-sm font-light tracking-[0.2em] text-center uppercase">
                    ✨ Painting Memories... {Math.round(progress)}%
                </div>
            )}

            {finished && (
                <>
                    <div className="absolute top-24 px-6 py-2 bg-white/5 backdrop-blur-sm rounded-full z-20 animate-bounce text-yellow-300/80 text-xs font-semibold tracking-widest uppercase">
                        ✨ Rub art to reveal!
                    </div>
                    <WishLantern />
                </>
            )}

            {initialized && (
                <div className={`absolute bottom-0 w-full flex flex-col items-center justify-end pb-8 md:pb-12 pointer-events-none z-20 transition-all duration-1000 ${finished ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}>
                    <h1 className="text-4xl md:text-7xl lg:text-8xl text-center px-4 font-bold text-yellow-400"
                        style={{ fontFamily: "'Dancing Script', cursive", textShadow: "0 0 20px #FF00DE, 0 0 40px #FF00DE" }}>
                        {MESSAGE}
                    </h1>
                    <div className="mt-2 px-6 max-w-2xl text-center text-white/90 text-xs md:text-base font-medium leading-relaxed drop-shadow-md" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {typedText}<span className={typedText.length < SUB_MESSAGE.length ? "animate-pulse" : "hidden"}>|</span>
                    </div>
                </div>
            )}

            {finished && (
                <div className="absolute top-6 right-6 z-30">
                    <button onClick={saveMemory} className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 px-6 py-3 rounded-full backdrop-blur-md transition-all text-xs font-bold uppercase tracking-widest shadow-lg">
                        Save Memory 📸
                    </button>
                </div>
            )}

            <a href="https://dill.is-a.dev" target="_blank" rel="noopener noreferrer"
                className="absolute bottom-4 right-4 z-50 transition-all hover:scale-110 opacity-60 hover:opacity-100">
                <img src="/dev.png" alt="Zen Technologies / Dill" title="Zen Technologies / Dill" className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 shadow-lg backdrop-blur-sm" />
            </a>

            {finished && <Fireworks />}
        </div>
    );
}

const InteractiveTrail = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        const particles: any[] = [];
        const addParticle = (x: number, y: number) => {
            particles.push({ x, y, size: Math.random() * 3 + 1, color: `hsl(${Math.random() * 360}, 100%, 75%)`, life: 1 });
        };
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if ('touches' in e) { for (let i = 0; i < e.touches.length; i++) addParticle(e.touches[i].clientX, e.touches[i].clientY); }
            else { addParticle((e as MouseEvent).clientX, (e as MouseEvent).clientY); }
        };
        window.addEventListener('mousemove', handleMove); window.addEventListener('touchmove', handleMove);
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]; p.life -= 0.03; p.y -= 0.5;
                if (p.life <= 0) { particles.splice(i, 1); i--; continue; }
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            }
            requestAnimationFrame(animate);
        };
        animate();
        return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('touchmove', handleMove); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50" />;
};

const Fireworks = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        const particles: any[] = [];
        const createFirework = () => {
            const x = Math.random() * canvas.width; const y = Math.random() * (canvas.height / 2);
            const color = `hsl(${Math.random() * 360}, 100%, 60%)`;
            for (let i = 0; i < 40; i++) {
                const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 3 + 1;
                particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 1, gravity: 0.06 });
            }
        };
        const interval = setInterval(createFirework, 1000);
        const animate = () => {
            ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= 0.015;
                if (p.life <= 0) { particles.splice(i, 1); i--; continue; }
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
            }
            requestAnimationFrame(animate);
        };
        animate();
        return () => clearInterval(interval);
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-40" />;
};
