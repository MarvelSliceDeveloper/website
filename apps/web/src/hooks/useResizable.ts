"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface UseResizableOptions {
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResizeEnd?: (size: { width: number; height: number }) => void;
}

export interface UseResizableReturn {
  width: number;
  height: number;
  isResizing: boolean;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
}

export function useResizable({
  initialWidth = 400,
  initialHeight = 350,
  minWidth = 320,
  minHeight = 220,
  maxWidth = 900,
  maxHeight = 800,
  onResizeEnd,
}: UseResizableOptions = {}): UseResizableReturn {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const isResizingRef = useRef(false);
  const sizeRef = useRef({ width: initialWidth, height: initialHeight });
  const dragStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const mouseUpRef = useRef<(() => void) | null>(null);
  const touchEndRef = useRef<(() => void) | null>(null);

  const clampSize = useCallback(
    (w: number, h: number) => ({
      width: Math.max(minWidth, Math.min(w, maxWidth)),
      height: Math.max(minHeight, Math.min(h, maxHeight)),
    }),
    [minWidth, minHeight, maxWidth, maxHeight],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      e.preventDefault();
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newSize = clampSize(
        dragStartRef.current.width + dx,
        dragStartRef.current.height + dy,
      );
      sizeRef.current = newSize;
      setWidth(newSize.width);
      setHeight(newSize.height);
    },
    [clampSize],
  );

  const handleMouseUp = useCallback(() => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    setIsResizing(false);
    onResizeEnd?.(sizeRef.current);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", mouseUpRef.current!);
  }, [handleMouseMove, onResizeEnd]);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isResizingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      const newSize = clampSize(
        dragStartRef.current.width + dx,
        dragStartRef.current.height + dy,
      );
      sizeRef.current = newSize;
      setWidth(newSize.width);
      setHeight(newSize.height);
    },
    [clampSize],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    setIsResizing(false);
    onResizeEnd?.(sizeRef.current);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", touchEndRef.current!);
  }, [handleTouchMove, onResizeEnd]);

  useEffect(() => {
    mouseUpRef.current = handleMouseUp;
    touchEndRef.current = handleTouchEnd;
  }, [handleMouseUp, handleTouchEnd]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: sizeRef.current.width,
        height: sizeRef.current.height,
      };
      isResizingRef.current = true;
      setIsResizing(true);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        width: sizeRef.current.width,
        height: sizeRef.current.height,
      };
      isResizingRef.current = true;
      setIsResizing(true);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    },
    [handleTouchMove, handleTouchEnd],
  );

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return {
    width,
    height,
    isResizing,
    handleMouseDown,
    handleTouchStart,
  };
}
