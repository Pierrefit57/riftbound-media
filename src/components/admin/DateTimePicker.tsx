import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DateTimePickerProps {
    id?: string;
    name?: string;
    label?: string;
    initialDate?: string | Date; // ISO string or Date object
    required?: boolean;
    onChange?: (date: Date | undefined) => void;
}

export default function DateTimePicker({
    id,
    name,
    label,
    initialDate,
    required = false,
    onChange
}: DateTimePickerProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        initialDate ? (typeof initialDate === 'string' ? parseISO(initialDate) : initialDate) : undefined
    );
    const [isOpen, setIsOpen] = useState(false);
    const [timeValue, setTimeValue] = useState(
        selectedDate ? format(selectedDate, 'HH:mm') : '12:00'
    );

    const containerRef = useRef<HTMLDivElement>(null);

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Listen for external updates (e.g., draft restoration)
    useEffect(() => {
        if (!id) return;
        const handleExternalUpdate = (e: CustomEvent) => {
            if (e.detail && e.detail.date) {
                const newDate = parseISO(e.detail.date);
                if (isValid(newDate)) {
                    setSelectedDate(newDate);
                    setTimeValue(format(newDate, 'HH:mm'));
                }
            }
        };

        window.addEventListener(`update-date-${id}`, handleExternalUpdate as EventListener);
        return () => window.removeEventListener(`update-date-${id}`, handleExternalUpdate as EventListener);
    }, [id]);

    // Sync input hidden value
    const hiddenDateValue = selectedDate ? selectedDate.toISOString() : '';

    const notifyChange = (newDate: Date | undefined) => {
        if (id) {
            const event = new CustomEvent(`date-change-${id}`, {
                detail: { date: newDate ? newDate.toISOString() : null }
            });
            window.dispatchEvent(event);
        }
        if (onChange) onChange(newDate);
    };

    const handleDaySelect = (date: Date | undefined) => {
        if (!date) {
            setSelectedDate(undefined);
            notifyChange(undefined);
            return;
        }

        // Preserve time from current state or default
        const [hours, minutes] = timeValue.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours || 0);
        newDate.setMinutes(minutes || 0);

        setSelectedDate(newDate);
        notifyChange(newDate);
        // Do not close immediately, allow time change? Or close? User usually expects date pick to close.
        // But we have time. So maybe keep open or close only if clicked outside?
        // Let's keep open to allow time adjustment.
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        setTimeValue(time);

        if (selectedDate) {
            const [hours, minutes] = time.split(':').map(Number);
            const newDate = new Date(selectedDate);
            newDate.setHours(hours || 0);
            newDate.setMinutes(minutes || 0);
            setSelectedDate(newDate);
            notifyChange(newDate);
        }
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    const formattedDate = selectedDate && isValid(selectedDate)
        ? format(selectedDate, 'dd/MM/yyyy HH:mm', { locale: fr })
        : '';

    // Custom CSS for DayPicker to match theme
    // We inject a style tag for specific overrides if needed, or use classNames.
    // For now, using standard style.css but we can override colors via CSS variables or specific classes.
    // We'll wrap in a div with custom vars.

    const themeStyles = `
        .rdp {
            --rdp-cell-size: 40px;
            --rdp-accent-color: #E9870F;
            --rdp-background-color: #e7f5ff;
            margin: 0;
        }
        .rdp-day_selected:not([disabled]) { 
            background-color: #E9870F; 
            font-weight: bold;
        }
        .rdp-day_today {
            color: #E9870F;
            font-weight: bold;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
            background-color: rgba(233,135,15, 0.1);
        }
    `;

    return (
        <div className="relative" ref={containerRef}>
            <style>{themeStyles}</style>
            {label && <label className="block text-sm font-medium text-rift-300 mb-2">{label}</label>}

            <input type="hidden" name={name} id={id} value={hiddenDateValue} required={required} />

            <button
                type="button"
                onClick={toggleOpen}
                className={`w-full px-4 py-2.5 rounded-lg bg-rift-950 border border-rift-700/50 text-left flex items-center justify-between transition-colors ${isOpen ? 'border-accent-spirit/50 ring-1 ring-accent-spirit/30' : 'hover:border-rift-600'}`}
            >
                <span className={formattedDate ? 'text-rift-100' : 'text-rift-600'}>
                    {formattedDate || 'Choisir une date...'}
                </span>
                <span className="text-rift-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-2 p-4 bg-rift-900 border border-rift-700 rounded-xl shadow-2xl flex flex-col gap-4 min-w-[320px]">
                    <div className="flex justify-center bg-rift-950/50 rounded-lg p-2">
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDaySelect}
                            locale={fr}
                            modifiersClassNames={{
                                selected: 'bg-accent-spirit text-white hover:bg-accent-spirit',
                                today: 'text-accent-spirit font-bold'
                            }}
                            styles={{
                                caption: { color: '#e2e8f0' },
                                head_cell: { color: '#94a3b8' },
                                day: { color: '#f1f5f9' },
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-rift-800">
                        <span className="text-sm text-rift-400 font-medium">Heure :</span>
                        <input
                            type="time"
                            value={timeValue}
                            onChange={handleTimeChange}
                            className="bg-rift-950 border border-rift-700 rounded-lg px-3 py-1.5 text-rift-100 focus:outline-none focus:border-accent-spirit/50"
                        />
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="ml-auto text-xs font-bold text-accent-spirit hover:text-accent-forge uppercase tracking-wider"
                        >
                            Valider
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
