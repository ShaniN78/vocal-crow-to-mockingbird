'use client';

interface PitchVisualizationProps {
  targetFrequency: number;
  currentPitch: number | null;
  isOnPitch: boolean;
}

export default function PitchVisualization({ targetFrequency, currentPitch, isOnPitch }: PitchVisualizationProps) {
  // Calculate position of current pitch relative to target
  // We'll show a range of ±50 cents (±3% frequency) around the target
  const maxDeviation = 0.1; // 10% = ~100 cents
  const rangeMin = targetFrequency * (1 - maxDeviation);
  const rangeMax = targetFrequency * (1 + maxDeviation);
  const totalRange = rangeMax - rangeMin;

  let position = 50; // Center position (50%)
  let isVisible = false;

  if (currentPitch && currentPitch > 0) {
    if (currentPitch >= rangeMin && currentPitch <= rangeMax) {
      // Within display range - map linearly from rangeMin (0%) to rangeMax (100%)
      position = ((currentPitch - rangeMin) / totalRange) * 100;
      isVisible = true;
    } else if (currentPitch < rangeMin) {
      // Too low - clamp to 0%
      position = 0;
      isVisible = true;
    } else {
      // Too high - clamp to 100%
      position = 100;
      isVisible = true;
    }
  }

  return (
    <div className="relative w-full h-24">
      {/* Background scale */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-1 bg-gradient-to-r from-blue-400 via-green-400 via-green-400 to-blue-400"></div>
      </div>
      
      {/* Center line (target pitch) */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-purple-600 dark:bg-purple-400 transform -translate-x-1/2">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-purple-600 dark:text-purple-400">
          Target
        </div>
      </div>

      {/* Current pitch indicator */}
      {isVisible && (
        <div
          className="absolute top-0 bottom-0 w-1 bg-red-500 dark:bg-red-400 transform -translate-x-1/2 transition-all duration-100 ease-out z-10"
          style={{ left: `${position}%` }}
        >
          <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-red-500 dark:text-red-400 whitespace-nowrap">
            You
          </div>
          {isOnPitch && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-500">
              ✓
            </div>
          )}
        </div>
      )}

      {/* Frequency labels */}
      {currentPitch && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>{rangeMin.toFixed(0)} Hz</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">{targetFrequency.toFixed(0)} Hz</span>
          <span>{rangeMax.toFixed(0)} Hz</span>
        </div>
      )}
    </div>
  );
}

