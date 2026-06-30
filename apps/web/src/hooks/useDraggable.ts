"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseDraggableOptions {
  initialPosition?: { x: number; y: number };
  bounds?: "viewport" | "parent";
  onDragEnd?: (position: { x: number; y: number }) => void;
}

export interface UseDraggableReturn {
  position: { x: number; y: number };
  isDragging: boolean;
  ref: (el: HTMLDivElement | null) => void;
  handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
}

export function useDraggable({
  initialPosition = { x: 80, y: 80 },
  bounds = "viewport",
  onDragEnd,
}: UseDraggableOptions = {}): UseDraggableReturn {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const positionRef = useRef(initialPosition);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement | null>(null);

  const clampPosition = useCallback(
    (x: number, y: number, el: HTMLDivElement | null) => {
      if (bounds === "viewport") {
        if (!el) return { x, y };
        const rect = el.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        return {
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        };
      }
      if (bounds === "parent") {
        if (!el?.parentElement) return { x, y };
        const parentRect = el.parentElement.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        const maxX = parentRect.width - rect.width;
        const maxY = parentRect.height - rect.height;
        return {
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        };
      }
      return { x, y };
    },
    [bounds]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newPos = {
      x: positionRef.current.x + dx,
      y: positionRef.current.y + dy,
    };
    const clamped = clampPosition(newPos.x, newPos.y, elementRef.current);
    positionRef.current = clamped;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setPosition(clamped);
  }, [clampPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    onDragEnd?.(positionRef.current);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, onDragEnd]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    const newPos = {
      x: positionRef.current.x + dx,
      y: positionRef.current.y + dy,
    };
    const clamped = clampPosition(newPos.x, newPos.y, elementRef.current);
    positionRef.current = clamped;
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    setPosition(clamped);
  }, [clampPosition]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    onDragEnd?.(positionRef.current);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  }, [handleTouchMove, onDragEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionRef.current = { x: positionRef.current.x, y: positionRef.current.y };
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    positionRef.current = { x: positionRef.current.x, y: positionRef.current.y };
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  }, [handleTouchMove, handleTouchEnd]);

  const setRef = useCallback((el: HTMLDivElement | null) => {
    elementRef.current = el;
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return {
    position,
    isDragging,
    ref: setRef,
    handleMouseDown,
    handleTouchStart,
  };
}
