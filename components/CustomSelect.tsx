"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  label?: string;
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  label,
  icon,
  placeholder = "Select...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-black border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between text-xs font-bold transition-all hover:border-white/30 text-white ${isOpen ? 'border-white/50 ring-1 ring-white/20' : ''}`}
        type="button"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <span className={selectedOption ? 'text-white' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center justify-between transition-colors hover:bg-white/10 ${option.value === value ? 'text-green-400 bg-green-500/10' : 'text-gray-300'
                  }`}
              >
                {option.label}
                {option.value === value && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
