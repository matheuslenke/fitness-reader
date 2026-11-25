import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

const REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 112;
const REFRESHING_DISTANCE = 56;

type PullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<void>;
};

function getPullDistance(touchDistance: number): number {
  return Math.min(MAX_PULL_DISTANCE, touchDistance * 0.55);
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updatePullDistance = (distance: number) => {
      pullDistanceRef.current = distance;
      setPullDistance(distance);
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);

      if (
        isRefreshing ||
        event.touches.length !== 1 ||
        !touch ||
        window.scrollY > 0
      ) {
        touchStartY.current = null;
        return;
      }

      touchStartY.current = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches.item(0);

      if (
        touchStartY.current == null ||
        event.touches.length !== 1 ||
        !touch
      ) {
        return;
      }

      const touchDistance = touch.clientY - touchStartY.current;

      if (touchDistance <= 0) {
        updatePullDistance(0);
        return;
      }

      event.preventDefault();
      updatePullDistance(getPullDistance(touchDistance));
    };

    const handleTouchEnd = () => {
      touchStartY.current = null;

      if (pullDistanceRef.current < REFRESH_THRESHOLD) {
        updatePullDistance(0);
        return;
      }

      setIsRefreshing(true);
      updatePullDistance(REFRESHING_DISTANCE);

      void onRefresh().finally(() => {
        setIsRefreshing(false);
        updatePullDistance(0);
      });
    };

    const handleTouchCancel = () => {
      touchStartY.current = null;
      updatePullDistance(0);
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [isRefreshing, onRefresh]);

  const hasReachedThreshold = pullDistance >= REFRESH_THRESHOLD;
  const indicatorStyle: CSSProperties = {
    opacity: Math.min(1, pullDistance / 36),
    transform: `translate3d(-50%, ${pullDistance - 44}px, 0)`,
  };
  const contentStyle: CSSProperties | undefined =
    pullDistance > 0
      ? { transform: `translate3d(0, ${pullDistance}px, 0)` }
      : undefined;

  return (
    <div className="pull-to-refresh">
      <div
        className={`pull-to-refresh__indicator${isRefreshing ? " is-refreshing" : ""}`}
        style={indicatorStyle}
        role="status"
        aria-live="polite"
      >
        <svg
          className="pull-to-refresh__icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 11a8 8 0 1 0-2.34 5.66M20 11V5m0 6h-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>
          {isRefreshing
            ? "Atualizando..."
            : hasReachedThreshold
              ? "Solte para atualizar"
              : "Puxe para atualizar"}
        </span>
      </div>

      <div
        ref={containerRef}
        className={`pull-to-refresh__content${pullDistance > 0 ? " is-pulling" : ""}`}
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  );
}
