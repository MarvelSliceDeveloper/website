"use client";

import { useState, useEffect, useRef } from "react";
import { IconSearch, IconX } from "@tabler/icons-react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
}

/**
 * Search input with icon, debounce, and clear button.
 * Debounces onChange to avoid excessive re-renders.
 */
export function SearchInput({
  placeholder = "Search...",
  value: controlledValue,
  onChange,
  debounceMs = 300,
  className = "",
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? "");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setInternalValue("");
    onChange("");
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <IconSearch
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-card pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted shadow-2xs transition-all duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-border-hover"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          aria-label="Clear search"
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

