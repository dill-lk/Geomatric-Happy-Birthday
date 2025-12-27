import React, { useState } from 'react';

export const WishLantern = () => {
    const [wish, setWish] = useState('');
    const [sent, setSent] = useState(false);

    const sendWish = () => {
        if (!wish.trim()) return;
        setSent(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            sendWish();
        }
    };

    return (
        <div className="absolute top-4 left-4 z-40">
            {!sent ? (
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Make a wish..." 
                        value={wish}
                        onChange={(e) => setWish(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm w-40 md:w-60"
                    />
                    <button 
                        onClick={sendWish}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center transition-transform active:scale-95"
                    >
                        🏮
                    </button>
                </div>
            ) : (
                <div className="lantern-container">
                    <div className="lantern-wrapper">
                        <div className="lantern-emoji">🏮</div>
                        <div className="lantern-text-container">
                            <span className="lantern-text">{wish}</span>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx>{`
                .lantern-container {
                    position: fixed;
                    bottom: 10%; /* Start slightly on screen */
                    left: 20%; /* More visible position */
                    z-index: 100;
                    animation: floatUp 8s ease-in forwards;
                    pointer-events: none;
                }
                
                .lantern-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    filter: drop-shadow(0 0 20px rgba(255, 165, 0, 0.6));
                }

                .lantern-emoji {
                    font-size: 80px;
                    animation: flicker 2s infinite alternate;
                }

                .lantern-text-container {
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(4px);
                    padding: 4px 12px;
                    border-radius: 12px;
                    margin-top: -10px;
                    max-width: 200px;
                }

                .lantern-text {
                    font-size: 14px;
                    color: #fff;
                    font-family: 'Montserrat', sans-serif;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: block;
                }

                @keyframes floatUp {
                    0% { bottom: 10%; opacity: 0; transform: scale(0.5); }
                    10% { opacity: 1; transform: scale(1); }
                    100% { bottom: 110%; opacity: 0; transform: translateY(-50px) rotate(5deg); }
                }

                @keyframes flicker {
                    0% { filter: brightness(1); transform: rotate(-2deg); }
                    100% { filter: brightness(1.2); transform: rotate(2deg); }
                }
            `}</style>
        </div>
    );
};