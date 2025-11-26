import React from 'react';
import { ShapeType } from '../types';
import { Maximize2, Minimize2, Hand, Camera, AlertCircle } from 'lucide-react';

export type HandStatus = 'detecting' | 'active' | 'lost' | 'one-hand' | 'error';

interface UIProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  color: string;
  setColor: (c: string) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  handStatus: HandStatus;
  onRetryCamera: () => void;
}

const UI: React.FC<UIProps> = ({
  currentShape,
  setShape,
  color,
  setColor,
  isFullscreen,
  toggleFullscreen,
  handStatus,
  onRetryCamera
}) => {
  
  const getStatusColor = () => {
    switch (handStatus) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'detecting': return 'bg-yellow-500/20 text-yellow-400';
      case 'one-hand': return 'bg-blue-500/20 text-blue-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      default: return 'bg-red-500/20 text-red-400';
    }
  };

  const getStatusText = () => {
    switch (handStatus) {
      case 'active': return 'System Active';
      case 'detecting': return 'Starting...';
      case 'one-hand': return 'One Hand Active';
      case 'error': return 'Camera Error';
      default: return 'No Hands';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-white text-2xl font-bold tracking-wider drop-shadow-md">AURA</h1>
          <p className="text-white/60 text-xs">Gesture Interactive Particles</p>
        </div>
        
        <div className="flex gap-2">
           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors ${getStatusColor()}`}>
              <Hand size={14} />
              <span className="text-xs font-medium uppercase">
                {getStatusText()}
              </span>
           </div>

          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* Instructions / Status */}
      {(handStatus === 'lost' || handStatus === 'detecting' || handStatus === 'one-hand') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          {/* Only show center instructions if we aren't actively controlling, or while detecting */}
          {handStatus === 'detecting' && (
             <div className="bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 text-white animate-pulse">
                <p className="text-lg font-medium">Initializing Camera...</p>
             </div>
          )}
          
          {handStatus === 'lost' && (
            <div className="opacity-0"></div> 
          )}
        </div>
      )}

      {/* Error / Retry State */}
      {handStatus === 'error' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-auto">
          <div className="bg-red-900/40 backdrop-blur-xl p-8 rounded-2xl border border-red-500/30 text-white">
            <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
            <h3 className="text-xl font-bold mb-2">Camera Access Needed</h3>
            <p className="text-white/70 mb-6 max-w-xs">
              Please allow camera access to interact with the particles.
            </p>
            <button 
              onClick={onRetryCamera}
              className="flex items-center gap-2 mx-auto px-6 py-3 bg-red-600 hover:bg-red-500 rounded-full font-medium transition-colors"
            >
              <Camera size={18} />
              Enable Camera
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls - Added right padding to avoid camera preview */}
      <div className="flex flex-col md:flex-row gap-4 items-end md:items-center pointer-events-auto md:pr-56">
        
        {/* Shape Selectors */}
        <div className="flex-1 overflow-x-auto w-full md:w-auto">
          <div className="flex gap-2 bg-black/30 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
            {Object.values(ShapeType).map((shape) => (
              <button
                key={shape}
                onClick={() => setShape(shape)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  currentShape === shape 
                    ? 'bg-white text-black shadow-lg shadow-white/10 scale-105' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl p-2 rounded-2xl border border-white/5">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:scale-110 transition-transform">
             <input 
              type="color" 
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] p-0 m-0 border-0 cursor-pointer"
             />
          </div>
        </div>

      </div>
    </div>
  );
};

export default UI;