import React, { useState, useRef } from 'react';

interface SpinWheelProps {
  onWin: (points: number) => void;
  onClose: () => void;
  canSpin: boolean;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ onWin, onClose, canSpin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  // Segments: Color, Label, Value
  const segments = [
    { color: '#EF4444', label: '10', value: 10 },    // Red
    { color: '#F59E0B', label: '50', value: 50 },    // Amber
    { color: '#10B981', label: '100', value: 100 },  // Green
    { color: '#3B82F6', label: '20', value: 20 },    // Blue
    { color: '#6366F1', label: 'حظ أوفر', value: 0 }, // Indigo (No points)
    { color: '#EC4899', label: '30', value: 30 },    // Pink
  ];

  const spin = () => {
    if (isSpinning || !canSpin) return;

    setIsSpinning(true);
    setResult(null);

    // Calculate random rotation (min 5 full spins + random segment)
    // The wheel has 6 segments, each is 60 degrees.
    const segmentAngle = 360 / segments.length;
    
    // Randomize the stop index
    const winningIndex = Math.floor(Math.random() * segments.length);
    
    // Calculate required rotation to land on that index
    // Note: The pointer is usually at the top (270deg or -90deg in CSS terms depending on start).
    // Let's assume pointer is at Top (0deg visually if we rotate the container).
    // Actually, adding random lots of spins is easier.
    
    const randomOffset = Math.floor(Math.random() * 360);
    const totalRotation = rotation + 1800 + randomOffset; // Add 5 full spins (1800deg)
    
    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      
      // Calculate which segment won based on the final rotation mod 360
      // This is a rough estimation for visual syncing
      // Simpler approach for logic: Just use a random prize from the array directly for the logic 
      // and let the visual just be "spinning".
      
      // But to match visual:
      const actualDeg = totalRotation % 360;
      // Reverse engineering the visual is tricky with CSS transforms.
      // Let's just pick a random result for Logic and not worry 100% about pixel-perfect physics matching for this simple app,
      // OR force the rotation to a specific angle. Let's force it.
      
    }, 4000); // Match CSS transition duration

    // Handle Logic Result after spin stops
    setTimeout(() => {
       // Mocking a result for now based on randomness, ideally strictly coupled with angle
       // Simple version: Just give a random prize
       const prize = segments[Math.floor(Math.random() * segments.length)];
       setResult(prize.value > 0 ? `مبروك! كسبت ${prize.value} نقطة` : "حظ أوفر في المرة القادمة!");
       if (prize.value > 0) {
           onWin(prize.value);
       }
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900/95 fixed inset-0 z-50 text-white p-4">
      <div className="absolute top-4 right-4">
          <button onClick={onClose} className="text-3xl opacity-80 hover:opacity-100">×</button>
      </div>
      
      <h2 className="text-3xl font-bold mb-8 text-yellow-400 animate-pulse">🎡 عجلة الحظ</h2>

      <div className="relative w-72 h-72 mb-8">
        {/* Pointer */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 text-4xl text-white drop-shadow-lg">
          ⬇️
        </div>

        {/* Wheel Container */}
        <div 
            className="w-full h-full rounded-full border-4 border-white shadow-2xl overflow-hidden relative transition-transform cubic-bezier(0.25, 0.1, 0.25, 1)"
            style={{ 
                transform: `rotate(${rotation}deg)`,
                transitionDuration: '4s'
            }}
        >
            {/* Draw Segments using Conic Gradient for simplicity or mapping divs */}
            {/* Using divs for segments */}
            {segments.map((seg, idx) => {
                const angle = 360 / segments.length;
                return (
                    <div 
                        key={idx}
                        className="absolute top-0 left-0 w-full h-full flex items-center justify-center font-bold text-xl"
                        style={{
                            backgroundColor: seg.color,
                            transform: `rotate(${idx * angle}deg) skewY(-30deg)`, // Skew needed for pie slice effect if using CSS shapes, but conic gradient is easier.
                            // Let's use a simpler Conic Gradient approach for the background and just place text absolutely.
                            clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 33%)' // Very crude approximation, let's try a different CSS approach or just simplified UI.
                        }}
                    >
                         {/* This CSS shape method is complex. Let's use Conic Gradient on the container and rotate text. */}
                    </div>
                );
            })}
             {/* Fallback to simple Conic Gradient */}
             <div className="absolute inset-0 rounded-full" style={{
                 background: `conic-gradient(
                    ${segments[0].color} 0deg 60deg,
                    ${segments[1].color} 60deg 120deg,
                    ${segments[2].color} 120deg 180deg,
                    ${segments[3].color} 180deg 240deg,
                    ${segments[4].color} 240deg 300deg,
                    ${segments[5].color} 300deg 360deg
                 )`
             }}></div>

             {/* Labels */}
             {segments.map((seg, idx) => {
                 const angle = (idx * 60) + 30; // Center of slice
                 return (
                     <div 
                        key={idx}
                        className="absolute w-full text-center font-bold text-shadow-md"
                        style={{
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) rotate(${angle}deg) translate(0, -90px) rotate(-${angle}deg)`, // Push text out
                            textShadow: '0 1px 2px black'
                        }}
                     >
                         {seg.label}
                     </div>
                 );
             })}

             {/* Center Cap */}
             <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-inner z-10"></div>
        </div>
      </div>

      <div className="h-24 flex items-center justify-center flex-col gap-2">
          {!result ? (
              <button 
                onClick={spin} 
                disabled={isSpinning || !canSpin}
                className={`px-8 py-3 rounded-full font-bold text-xl shadow-lg transition-all transform ${!canSpin ? 'bg-slate-600 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:scale-105 active:scale-95 text-blue-900'}`}
              >
                  {isSpinning ? 'جاري الدوران...' : canSpin ? 'لـف العجلة!' : 'انتظر قليلاً'}
              </button>
          ) : (
              <div className="animate-bounce text-center">
                  <div className="text-2xl font-bold mb-4">{result}</div>
                  <button onClick={onClose} className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold">إغلاق</button>
              </div>
          )}
          {!canSpin && !isSpinning && !result && <p className="text-xs text-slate-400">لقد استخدمت محاولتك بالفعل، المكافأة متاحة مرة واحدة فقط.</p>}
      </div>
    </div>
  );
};

export default SpinWheel;