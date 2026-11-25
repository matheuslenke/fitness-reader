import { useEffect, useRef, useState } from "react";

const REST_PRESETS = [30, 45, 60] as const;

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getPresetLabel(seconds: number): string {
  return seconds === 60 ? "1 min" : `${seconds}s`;
}

export function RestTimer() {
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerEndsAtRef = useRef<number | null>(null);
  const didNotifyRef = useRef(false);

  const isActive = remainingSeconds > 0;
  const progress =
    durationSeconds > 0 ? (remainingSeconds / durationSeconds) * 100 : 0;

  useEffect(() => {
    if (!isActive || timerEndsAtRef.current == null) return;

    const updateRemainingTime = () => {
      if (timerEndsAtRef.current == null) return;

      const nextRemainingSeconds = Math.max(
        0,
        Math.ceil((timerEndsAtRef.current - Date.now()) / 1000),
      );
      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0 && !didNotifyRef.current) {
        didNotifyRef.current = true;
        timerEndsAtRef.current = null;
        navigator.vibrate?.([160, 90, 160]);
      }
    };

    const intervalId = window.setInterval(updateRemainingTime, 250);
    updateRemainingTime();

    return () => window.clearInterval(intervalId);
  }, [isActive]);

  const startTimer = (seconds: number) => {
    didNotifyRef.current = false;
    timerEndsAtRef.current = Date.now() + seconds * 1000;
    setDurationSeconds(seconds);
    setRemainingSeconds(seconds);
  };

  const addTime = (seconds: number) => {
    const currentEnd = timerEndsAtRef.current ?? Date.now();
    timerEndsAtRef.current = Math.max(currentEnd, Date.now()) + seconds * 1000;
    setDurationSeconds((current) => current + seconds);
    setRemainingSeconds((current) => current + seconds);
  };

  const stopTimer = () => {
    timerEndsAtRef.current = null;
    setDurationSeconds(0);
    setRemainingSeconds(0);
  };

  return (
    <section className="rest-timer" aria-label="Timer de descanso">
      <div
        className={`rest-timer__status ${isActive ? "is-active" : ""}`}
        aria-live="polite"
      >
        <span>Descanso</span>
        <strong className="tabular-nums">
          {isActive ? formatTimer(remainingSeconds) : "00:00"}
        </strong>
        <span
          className="rest-timer__progress"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>

      <div className="rest-timer__controls">
        {REST_PRESETS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            className="touch-target"
            onClick={() => startTimer(seconds)}
            aria-label={`Iniciar descanso de ${getPresetLabel(seconds)}`}
          >
            {getPresetLabel(seconds)}
          </button>
        ))}
        {isActive && (
          <button
            type="button"
            className="touch-target is-secondary"
            onClick={() => addTime(15)}
          >
            +15s
          </button>
        )}
        {isActive && (
          <button
            type="button"
            className="touch-target is-stop"
            onClick={stopTimer}
            aria-label="Encerrar descanso"
          >
            ×
          </button>
        )}
      </div>
    </section>
  );
}
