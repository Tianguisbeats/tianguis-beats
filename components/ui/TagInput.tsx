"use client";

import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import { X, UserPlus } from 'lucide-react';

interface TagInputProps {
    tags: string[];
    setTags: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
}

export default function TagInput({ tags, setTags, placeholder = "Referencia (ej: Bad Bunny)", maxTags = 5 }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmedValue = inputValue.trim().replace(/,$/, '');
        if (trimmedValue && !tags.includes(trimmedValue) && tags.length < maxTags) {
            setTags([...tags, trimmedValue]);
            setInputValue('');
        } else {
            setInputValue(trimmedValue); // Keep input if duplicate or empty
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-background/50 border-2 border-border rounded-xl focus-within:border-accent transition-all duration-300">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="flex items-center gap-1.5 px-3 py-1 bg-card border border-border/50 text-foreground rounded-lg text-[11px] font-bold font-sans shadow-sm animate-in zoom-in-95 duration-200"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="p-0.5 hover:bg-red-500/10 hover:text-red-500 rounded-md transition-colors"
                        >
                            <X size={12} strokeWidth={3} />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addTag}
                    placeholder={tags.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm font-medium py-1 px-2 text-foreground placeholder:text-muted/50"
                />
            </div>
            <div className="flex items-center justify-between px-1">
                <p className="text-[9px] text-muted font-black uppercase tracking-widest flex items-center gap-1.5">
                    <UserPlus size={10} className="text-blue-500" /> Presley Enter o Coma para añadir
                </p>
                <span className="text-[9px] font-black text-muted uppercase tracking-widest">
                    {tags.length}/{maxTags} ARTISTAS
                </span>
            </div>
        </div>
    );
}
