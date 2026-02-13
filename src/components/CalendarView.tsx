import React, { useState, useMemo } from 'react';

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
    image_position?: string;
    image_size?: string;
    country?: string;
    all_day?: boolean;
}

interface Props {
    initialEvents: CalendarEvent[];
    currentUser?: { id: string; email?: string };
}

const CalendarView: React.FC<Props> = ({ initialEvents, currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [followedEventIds, setFollowedEventIds] = useState<Set<string>>(new Set());
    const [isFollowLoading, setIsFollowLoading] = useState(false);

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

    const calendarDays = useMemo(() => {
        const days = [];
        const totalDays = daysInMonth(year, month);
        const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust to start on Monday

        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [year, month]);

    const getEventsForDay = (date: Date) => {
        return initialEvents.filter(event => {
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

            return checkYMD >= startYMD && checkYMD <= endYMD;
        });
    };

    const getEventClass = (onImage: boolean = false) => {
        if (onImage) {
            return 'bg-rift-900/80 text-white border-rift-700/50 backdrop-blur-sm';
        }
        return 'bg-rift-800/50 border-rift-700/50 text-rift-200 hover:bg-rift-700/50 hover:text-rift-50';
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedEvent(null);
        };
        if (selectedEvent) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEvent]);

    React.useEffect(() => {
        if (currentUser) {
            fetch('/api/calendar/follow')
                .then(res => res.json())
                .then(data => {
                    if (data.followedIds) setFollowedEventIds(new Set(data.followedIds));
                })
                .catch(err => console.error('Error fetching follows:', err));
        }
    }, [currentUser]);

    const handleToggleFollow = async (eventId: string) => {
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }

        setIsFollowLoading(true);
        const isFollowing = followedEventIds.has(eventId);

        try {
            const res = await fetch('/api/calendar/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, action: isFollowing ? 'unfollow' : 'follow' })
            });

            if (res.ok) {
                setFollowedEventIds(prev => {
                    const next = new Set(prev);
                    if (isFollowing) next.delete(eventId);
                    else next.add(eventId);
                    return next;
                });
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
        } finally {
            setIsFollowLoading(false);
        }
    };

    return (
        <div className="w-full">
            {/* Animated Container for Calendar Content */}
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-accent-spirit/10 border border-accent-spirit/20 text-accent-spirit shadow-spirit/20">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-rift-50 tracking-tight">
                                {monthNames[month]} <span className="text-rift-500 font-medium">{year}</span>
                            </h2>
                            <p className="text-xs text-rift-400 font-medium uppercase tracking-[0.2em] mt-0.5">Événements Riftbound</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-rift-800/50 p-1.5 rounded-xl border border-rift-700/50 backdrop-blur-sm self-start md:self-auto">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded-lg hover:bg-rift-700 text-rift-300 transition-colors"
                            aria-label="Mois précédent"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-rift-200 hover:text-accent-spirit transition-colors"
                        >
                            Aujourd'hui
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-rift-700 text-rift-300 transition-colors"
                            aria-label="Mois suivant"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-4">
                    {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(day => (
                        <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-rift-500">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-3">
                    {calendarDays.map((date, i) => {
                        const isToday = date && date.toDateString() === new Date().toDateString();
                        const events = date ? getEventsForDay(date) : [];
                        const showBigCard = events.length === 1 && !!events[0].image_url;
                        const bigEvent = showBigCard ? events[0] : null;

                        const getDayBorderClass = () => {
                            if (!date) return 'bg-transparent border-transparent';
                            if (isToday) return 'bg-rift-900 border-accent-spirit shadow-[0_0_15px_-3px_rgba(233,135,15,0.3)]';
                            if (events.length > 0) return 'bg-rift-900/60 border-rift-600/50 hover:border-rift-400';
                            return 'bg-rift-900/40 border-rift-800/40 hover:border-rift-700';
                        };

                        return (
                            <div
                                key={i}
                                onClick={() => { if (bigEvent) setSelectedEvent(bigEvent); }}
                                className={`min-h-[120px] md:min-h-[140px] p-2 rounded-xl border transition-all relative overflow-hidden flex flex-col group
                                    ${getDayBorderClass()}
                                    ${bigEvent ? 'cursor-pointer p-0' : ''}
                                `}
                                style={bigEvent && bigEvent.image_url ? {
                                    backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url(${bigEvent.image_url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: bigEvent.image_position || '50% 50%'
                                } : {}}
                            >
                                {date && (
                                    <div className={`relative z-10 flex flex-col h-full w-full ${bigEvent ? 'p-3' : ''}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[11px] font-bold ${isToday ? 'text-accent-spirit' : bigEvent ? 'text-white' : 'text-rift-400'}`}>
                                                {date.getDate()}
                                            </span>
                                        </div>

                                        {bigEvent && (
                                            <div className="mt-auto">
                                                {bigEvent.country && (
                                                    <div className="absolute top-2 right-2">
                                                        {(() => {
                                                            const isWorld = bigEvent.country?.toUpperCase() === 'WORLD';
                                                            return isWorld ? (
                                                                <div className="w-6 h-6 flex items-center justify-center bg-rift-900 rounded-full border border-rift-700">
                                                                    <img src="/assets/icons/864e0e4584241547.svg" className="w-4 h-4" alt="World" />
                                                                </div>
                                                            ) : (
                                                                <img src={`https://flagcdn.com/w40/${bigEvent.country.toLowerCase()}.png`} width="20" alt={bigEvent.country} className="rounded-sm border border-white/10" />
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                                <p className="font-bold text-white text-xs line-clamp-2 drop-shadow-md">
                                                    {bigEvent.title}
                                                </p>
                                            </div>
                                        )}

                                        {!bigEvent && (
                                            <div className="space-y-1 w-full mt-1">
                                                {events.map(event => (
                                                    <button
                                                        key={event.id}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                                        className={`w-full text-left p-1.5 rounded-md border text-[10px] font-bold truncate transition-all ${getEventClass(!!event.image_url)}`}
                                                        style={event.image_url ? {
                                                            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${event.image_url})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: event.image_position || '50% 50%',
                                                            color: 'white',
                                                            border: 'none'
                                                        } : {}}
                                                    >
                                                        {event.title}
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
            </div>

            {/* Modal - Siblings to the animated content to avoid containment issues */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-rift-950/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setSelectedEvent(null)}
                    ></div>

                    <div className="relative w-full max-w-lg bg-rift-900 border border-rift-700 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 z-50 p-2 rounded-full text-white/70 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-md transition-all border border-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-0">
                            {selectedEvent.image_url && (
                                <div className="h-48 w-full relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-rift-900 to-transparent z-10" />
                                    <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" style={{ objectPosition: selectedEvent.image_position || '50% 50%' }} />
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-spirit/50 z-20" />
                                </div>
                            )}
                            {!selectedEvent.image_url && <div className="h-4 bg-rift-800" />}

                            <div className="p-8 pt-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <h3 className="text-2xl font-display font-bold text-rift-50">{selectedEvent.title}</h3>
                                    {selectedEvent.country && (
                                        <div className="flex-shrink-0">
                                            {(() => {
                                                const isWorld = selectedEvent.country?.toUpperCase() === 'WORLD';
                                                return isWorld ? (
                                                    <div className="w-7 h-7 flex items-center justify-center bg-rift-800 rounded-full border border-rift-700">
                                                        <img src="/assets/icons/864e0e4584241547.svg" className="w-4 h-4" alt="World" />
                                                    </div>
                                                ) : (
                                                    <img src={`https://flagcdn.com/w40/${selectedEvent.country.toLowerCase()}.png`} width="24" alt={selectedEvent.country} className="rounded-sm border border-white/10" />
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleToggleFollow(selectedEvent.id)}
                                    disabled={isFollowLoading}
                                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all mb-6
                                        ${followedEventIds.has(selectedEvent.id) ? 'bg-domain-calm/20 text-domain-calm border border-domain-calm/30' : 'bg-accent-spirit/10 text-accent-spirit border border-accent-spirit/30'}
                                        ${isFollowLoading ? 'opacity-50 cursor-wait' : ''}
                                    `}
                                >
                                    <svg className="w-3.5 h-3.5" fill={followedEventIds.has(selectedEvent.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                    </svg>
                                    {followedEventIds.has(selectedEvent.id) ? 'Suivi' : 'Suivre'}
                                </button>

                                <div className="space-y-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-rift-800 flex items-center justify-center text-accent-spirit">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-rift-500 uppercase tracking-widest leading-none mb-1">Date et Heure</p>
                                                <p className="font-semibold">{new Date(selectedEvent.start_date.split('.')[0]).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-px bg-rift-800/60" />
                                    <div>
                                        <p className="text-[10px] font-bold text-rift-500 uppercase tracking-widest mb-3">Détails</p>
                                        <p className="text-rift-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedEvent.description || "Aucune description fournie."}</p>
                                    </div>
                                    {selectedEvent.url && (
                                        <a href={selectedEvent.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs bg-accent-spirit text-rift-950 transition-all hover:scale-[1.02]">
                                            Voir les détails
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
