import React, { useState, useMemo } from 'react';
// Force HMR with grid fix


interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date?: string;
    type: string;
    url?: string;
    location?: string;
    image_url?: string;
    image_position?: string; // CSS object-position / background-position
    image_size?: string; // CSS background-size / width-height percentage
    country?: string; // ISO 2-letter code
    all_day?: boolean;
}

interface Props {
    initialEvents: CalendarEvent[];
}

const CalendarView: React.FC<Props> = ({ initialEvents }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const calendarDays = useMemo(() => {
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust to start on Monday (0=Mon, 6=Sun)

        // Prepend empty slots for previous month's days
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [year, month]);

    const getEventsForDay = (date: Date) => {
        return initialEvents.filter(event => {
            // Robust "Wall Clock" comparison using YYYY-MM-DD strings
            // This avoids any timezone shifts (e.g. 23:59 becoming next day)

            const toYMD = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const stripTZ = (s: string) => s.split('.')[0].split('+')[0].split('Z')[0];

            const eventStart = new Date(stripTZ(event.start_date));
            const eventEnd = event.end_date ? new Date(stripTZ(event.end_date)) : new Date(eventStart);

            const checkYMD = toYMD(date);
            const startYMD = toYMD(eventStart);
            const endYMD = toYMD(eventEnd);

            // Simple string comparison works for ISO dates
            return checkYMD >= startYMD && checkYMD <= endYMD;
        });
    };

    const getEventClass = (onImage: boolean = false) => {
        if (onImage) {
            return 'bg-rift-900/80 text-white border-rift-700/50 backdrop-blur-sm';
        }
        return 'bg-rift-800/50 border-rift-700/50 text-rift-200 hover:bg-rift-700/50 hover:text-rift-50';
    };

    // Handle Escape key to close modal
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedEvent(null);
            }
        };

        if (selectedEvent) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedEvent]);

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4 ml-auto">
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded-lg bg-rift-800 hover:bg-rift-700 text-rift-300 transition-colors border border-rift-700/50"
                        aria-label="Mois précédent"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <span className="text-lg font-bold text-rift-100 capitalize min-w-[140px] text-center">
                        {monthNames[month]} {year}
                    </span>

                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-lg bg-rift-800 hover:bg-rift-700 text-rift-300 transition-colors border border-rift-700/50"
                        aria-label="Mois suivant"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 mb-4">
                {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-rift-500">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-3">
                {calendarDays.map((date, i) => {
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const events = date ? getEventsForDay(date) : [];

                    // Hybrid Logic:
                    // If ONE event AND it has an image -> Show Big Card (Full Cell Background)
                    // Else -> Show List of Small Cards
                    const showBigCard = events.length === 1 && !!events[0].image_url;
                    const bigEvent = showBigCard ? events[0] : null;

                    // Helper to get border/shadow based on event presence
                    const getDayBorderClass = () => {
                        if (!date) return 'bg-transparent border-transparent';
                        if (isToday) return 'bg-rift-900 border-accent-spirit shadow-[0_0_15px_-3px_rgba(233,135,15,0.3)]';

                        if (events.length > 0) {
                            return 'bg-rift-900/60 border-rift-600/50 hover:border-rift-400';
                        }

                        return 'bg-rift-900/40 border-rift-800/40 hover:border-rift-700';
                    };

                    return (
                        <div
                            key={i}
                            onClick={() => {
                                if (bigEvent) setSelectedEvent(bigEvent);
                            }}
                            className={`min-h-[120px] md:min-h-[140px] p-2 rounded-xl border transition-all relative overflow-hidden flex flex-col group
                                ${getDayBorderClass()}
                                ${bigEvent ? 'cursor-pointer p-0' : ''}
                            `}
                            style={bigEvent && bigEvent.image_url ? {
                                backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url(${bigEvent.image_url})`,
                                backgroundSize: bigEvent.image_size || 'cover',
                                backgroundPosition: bigEvent.image_position || '50% 50%'
                            } : {}}
                        >
                            {date && (
                                <div className={`relative z-10 flex flex-col h-full w-full ${bigEvent ? 'p-3' : ''}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[11px] font-bold ${isToday ? 'text-accent-spirit' : bigEvent ? 'text-white drop-shadow-md' : 'text-rift-400'}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>

                                    {/* Big Card Content */}
                                    {bigEvent && (
                                        <div className="mt-auto">
                                            {bigEvent.country && (
                                                <div className="absolute top-2 right-2 pointer-events-none">
                                                    {(() => {
                                                        const isWorld = bigEvent.country?.toUpperCase() === 'WORLD';
                                                        return isWorld ? (
                                                            <div className="w-7 h-7 flex items-center justify-center bg-rift-950/80 rounded-full border border-rift-700 shadow-lg backdrop-blur-md overflow-hidden">
                                                                <img
                                                                    src="/assets/icons/864e0e4584241547.svg"
                                                                    className="w-5 h-5 drop-shadow-sm"
                                                                    alt="World"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={`https://flagcdn.com/w40/${bigEvent.country.toLowerCase()}.png`}
                                                                srcSet={`https://flagcdn.com/w80/${bigEvent.country.toLowerCase()}.png 2x`}
                                                                width="24"
                                                                alt={bigEvent.country}
                                                                className="rounded-[2px] shadow-md border border-white/20"
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            <p className="font-bold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-xs line-clamp-2">
                                                {bigEvent.title}
                                            </p>
                                        </div>
                                    )}

                                    {/* List Content (Multiple Events or No Image) */}
                                    {!bigEvent && (
                                        <div className="space-y-1.5 w-full mt-1">
                                            {events.map(event => (
                                                <button
                                                    key={event.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedEvent(event);
                                                    }}
                                                    className={`w-full group/event text-left p-0 rounded-lg border text-[10px] font-bold shadow-sm relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]
                                                        ${getEventClass(!!event.image_url)}
                                                    `}
                                                    style={event.image_url ? {
                                                        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.75)), url(${event.image_url})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: event.image_position || '50% 50%',
                                                        minHeight: '40px',
                                                        color: 'white',
                                                        border: 'none',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'flex-end',
                                                        padding: '6px 8px'
                                                    } : { padding: '6px 8px' }}
                                                >
                                                    {event.country && (
                                                        <div className="absolute top-1 right-1 pointer-events-none">
                                                            {(() => {
                                                                const isWorld = event.country?.toUpperCase() === 'WORLD';
                                                                return isWorld ? (
                                                                    <div className="w-3 h-3 flex items-center justify-center bg-rift-950/60 rounded-full border border-rift-700/50 shadow-sm overflow-hidden">
                                                                        <img
                                                                            src="/assets/icons/864e0e4584241547.svg"
                                                                            className="w-2.5 h-2.5"
                                                                            alt="World"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <img
                                                                        src={`https://flagcdn.com/w20/${event.country.toLowerCase()}.png`}
                                                                        width="14"
                                                                        alt={event.country}
                                                                        className="rounded-[1px] shadow-sm border border-white/10"
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                    <span className="truncate w-full leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] block text-white">
                                                        {event.title}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal / Details Popup */}
            {
                selectedEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-rift-950/80 backdrop-blur-md animate-in fade-in duration-300"
                            onClick={() => setSelectedEvent(null)}
                        ></div>

                        <div className="relative w-full max-w-lg bg-rift-900 border border-rift-700 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-0">
                                {selectedEvent.image_url && (
                                    <div className="h-48 w-full relative">
                                        <div className={`absolute inset-0 bg-gradient-to-t from-rift-900 to-transparent z-10`}></div>
                                        <img
                                            src={selectedEvent.image_url}
                                            alt={selectedEvent.title}
                                            className="w-full h-full object-cover"
                                            style={{
                                                objectPosition: selectedEvent.image_position || '50% 50%'
                                            }}
                                        />
                                        {selectedEvent.country && (
                                            <div className="absolute top-4 right-4 z-30 pointer-events-none">
                                                {(() => {
                                                    const isWorld = selectedEvent.country?.toUpperCase() === 'WORLD';
                                                    return isWorld ? (
                                                        <div className="w-10 h-10 flex items-center justify-center bg-rift-950/80 rounded-full border border-rift-700 shadow-xl backdrop-blur-md overflow-hidden">
                                                            <img
                                                                src="/assets/icons/864e0e4584241547.svg"
                                                                className="w-7 h-7 drop-shadow-lg"
                                                                alt="World"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={`https://flagcdn.com/w80/${selectedEvent.country!.toLowerCase()}.png`}
                                                            width="40"
                                                            alt={selectedEvent.country}
                                                            className="rounded-sm shadow-xl border border-white/20"
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-spirit/50 z-20"></div>
                                    </div>
                                )}
                                {!selectedEvent.image_url && (
                                    <div className="relative">
                                        <div className="h-2 w-full bg-rift-700/50"></div>
                                        {selectedEvent.country && (
                                            <div className="absolute top-4 right-4 z-30 pointer-events-none">
                                                {(() => {
                                                    const isWorld = selectedEvent.country?.toUpperCase() === 'WORLD';
                                                    return isWorld ? (
                                                        <div className="w-10 h-10 flex items-center justify-center bg-rift-950/80 rounded-full border border-rift-700 shadow-xl backdrop-blur-md overflow-hidden">
                                                            <img
                                                                src="/assets/icons/864e0e4584241547.svg"
                                                                className="w-7 h-7 drop-shadow-lg"
                                                                alt="World"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={`https://flagcdn.com/w80/${selectedEvent.country!.toLowerCase()}.png`}
                                                            width="40"
                                                            alt={selectedEvent.country}
                                                            className="rounded-sm shadow-xl border border-white/20"
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-8">
                                    <div className="flex justify-between items-start gap-4 mb-6">
                                        <div>
                                            <h3 className="text-2xl font-display font-bold text-rift-50 leading-tight">
                                                {selectedEvent.title}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className="p-2 rounded-xl text-rift-500 hover:text-rift-50 bg-rift-800/50 hover:bg-rift-700/50 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-3 text-rift-200">
                                                <div className="w-10 h-10 rounded-xl bg-rift-800 flex items-center justify-center text-accent-spirit">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-rift-500 uppercase tracking-widest leading-none mb-1">Date et Heure</p>
                                                    <p className="font-semibold leading-relaxed">
                                                        {(() => {
                                                            const stripTZ = (s: string) => s.split('.')[0].split('+')[0].split('Z')[0];
                                                            const start = new Date(stripTZ(selectedEvent.start_date));
                                                            const end = selectedEvent.end_date ? new Date(stripTZ(selectedEvent.end_date)) : null;

                                                            const format = (d: Date) => d.toLocaleDateString('fr-FR', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                ...(selectedEvent.all_day ? {} : {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })
                                                            });

                                                            if (!end || start.toDateString() === end.toDateString()) {
                                                                return format(start);
                                                            }

                                                            return (
                                                                <>
                                                                    du {format(start)}
                                                                    <br />
                                                                    au {format(end)}
                                                                </>
                                                            );
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedEvent.location && (
                                                <div className="flex items-center gap-3 text-rift-200">
                                                    <div className="w-10 h-10 rounded-xl bg-rift-800 flex items-center justify-center text-accent-forge">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-rift-500 uppercase tracking-widest leading-none mb-1">Lieu / Plateforme</p>
                                                        <p className="font-semibold">{selectedEvent.location}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-rift-800/60"></div>

                                        <div>
                                            <p className="text-[10px] font-bold text-rift-500 uppercase tracking-widest mb-3">Détails</p>
                                            <p className="text-rift-300 leading-relaxed text-sm whitespace-pre-wrap">
                                                {selectedEvent.description || "Aucune description fournie pour cet événement."}
                                            </p>
                                        </div>

                                        {selectedEvent.url && (() => {
                                            const isTwitch = selectedEvent.url.includes('twitch.tv');
                                            return (
                                                <a
                                                    href={selectedEvent.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg hover:-translate-y-0.5
                                                    ${isTwitch
                                                            ? 'bg-[#9146FF] text-white hover:bg-[#9146FF]/90 shadow-[#9146FF]/20'
                                                            : 'bg-accent-spirit text-rift-950 hover:bg-accent-spirit/90 shadow-accent-spirit/20'
                                                        }
                                                `}
                                                >
                                                    {isTwitch ? 'VOIR LE STREAM' : 'Voir plus de détails'}
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </a>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CalendarView;
