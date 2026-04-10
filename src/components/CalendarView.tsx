// Final UI Sync - Vibrant Green Alerts & Twitch Logic
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
    const getParisDate = () => {
        const d = new Date();
        const parisString = d.toLocaleString('en-US', { timeZone: 'Europe/Paris' });
        return new Date(parisString);
    };

    const [currentDate, setCurrentDate] = useState(getParisDate());
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

    const getCountryCode = (country: string | undefined) => {
        if (!country) return '';
        const c = country.toUpperCase();
        if (c === 'UK') return 'gb';
        if (c === 'USA' || c === 'US') return 'us';
        return country.toLowerCase();
    };

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
            const toParisYMD = (dateStringOrDate: string | Date) => {
                try {
                    return new Intl.DateTimeFormat('en-CA', { 
                        timeZone: 'Europe/Paris', 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                    }).format(new Date(dateStringOrDate));
                } catch(e) {
                    return "";
                }
            };

            const checkYMD = toParisYMD(date);
            const startYMD = toParisYMD(event.start_date);
            const endYMD = event.end_date ? toParisYMD(event.end_date) : startYMD;

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

                    <div className="flex items-center gap-1 bg-rift-800/50 p-1 rounded-xl border border-rift-700/50 backdrop-blur-sm self-start md:self-auto">
                        <button
                            onClick={prevMonth}
                            className="p-2 rounded-lg hover:bg-rift-700 text-accent-spirit transition-colors"
                            aria-label="Mois précédent"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-rift-700 text-accent-spirit transition-colors"
                            aria-label="Mois suivant"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                        const isToday = date && date.toDateString() === getParisDate().toDateString();
                        const events = date ? getEventsForDay(date) : [];
                        const showBigCard = events.length === 1 && !!events[0].image_url;
                        const bigEvent = showBigCard ? events[0] : null;

                        const getDayBorderClass = () => {
                            if (!date) return 'bg-transparent border-transparent';
                            if (isToday) return 'bg-rift-900 border-accent-spirit shadow-[0_0_15px_-3px_rgba(233,135,15,0.3)]';
                            if (events.length > 0) return 'bg-rift-900/60 border-rift-600/50 hover:border-rift-400';
                            return 'bg-rift-900/40 border-rift-700/60 hover:border-rift-500';
                        };

                        return (
                            <div
                                key={i}
                                onClick={() => { if (bigEvent) setSelectedEvent(bigEvent); }}
                                className={`min-h-[120px] md:min-h-[140px] rounded-xl border transition-all relative overflow-hidden flex flex-col group
                                    ${getDayBorderClass()}
                                    ${bigEvent ? 'cursor-pointer p-0' : 'p-1'}
                                `}
                                style={bigEvent && bigEvent.image_url ? {
                                    backgroundImage: `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.75)), url(${bigEvent.image_url})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: bigEvent.image_position || '50% 50%'
                                } : {}}
                            >
                                {date && (
                                    <>
                                        <div className="absolute top-2 left-2 z-20 pointer-events-none">
                                            <span className={`text-[11px] font-bold drop-shadow-md ${isToday ? 'text-accent-spirit' : (events.length > 0 ? 'text-white' : 'text-rift-400')}`}>
                                                {date.getDate()}
                                            </span>
                                        </div>

                                        <div className={`relative z-10 flex flex-col h-full w-full ${bigEvent ? 'p-3' : ''}`}>
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
                                                                    <img src={`https://flagcdn.com/w40/${getCountryCode(bigEvent.country)}.png`} width="20" alt={bigEvent.country} className="rounded-sm border border-white/10" />
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                    <p className="font-bold text-white text-xs line-clamp-2 drop-shadow-md">
                                                        {bigEvent.title}
                                                    </p>
                                                    {followedEventIds.has(bigEvent.id) && (
                                                        <div className="absolute bottom-2 right-2 w-2 h-2 bg-[#22ff88] rounded-full shadow-[0_0_10px_rgba(34,255,136,0.8)] border border-white/40 z-20" title="Suivi activé" />
                                                    )}
                                                </div>
                                            )}

                                            {!bigEvent && (
                                                <div className="flex flex-col gap-1 w-full h-full">
                                                    {events.map(event => (
                                                        <button
                                                            key={event.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                                            className={`w-full text-left p-2 rounded-lg border text-xs font-bold truncate transition-all flex-1 min-h-0 flex flex-col justify-end items-start relative group/btn overflow-hidden ${getEventClass(!!event.image_url)}`}
                                                            style={event.image_url ? {
                                                                backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${event.image_url})`,
                                                                backgroundSize: 'cover',
                                                                backgroundPosition: event.image_position || '50% 50%',
                                                                color: 'white',
                                                                border: 'none'
                                                            } : {}}
                                                        >
                                                            {event.country && (
                                                                <div className="absolute top-1.5 right-1.5 z-20">
                                                                    {(() => {
                                                                        const isWorld = event.country?.toUpperCase() === 'WORLD';
                                                                        return isWorld ? (
                                                                            <div className="w-5 h-5 flex items-center justify-center bg-rift-900 rounded-full border border-rift-700 shadow-sm">
                                                                                <img src="/assets/icons/864e0e4584241547.svg" className="w-3 h-3" alt="World" />
                                                                            </div>
                                                                        ) : (
                                                                            <img src={`https://flagcdn.com/w40/${getCountryCode(event.country)}.png`} width="16" alt={event.country} className="rounded-sm border border-white/10 shadow-sm" />
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}
                                                            <span className="relative z-10 truncate w-full drop-shadow-md">{event.title}</span>
                                                            {followedEventIds.has(event.id) && (
                                                                <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 bg-[#22ff88] rounded-full shadow-[0_0_8px_rgba(34,255,136,0.8)] border border-white/40 z-20" title="Suivi activé" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
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
                                    <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" loading="lazy" style={{ objectPosition: selectedEvent.image_position || '50% 50%' }} />
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-accent-spirit/50 z-20" />
                                </div>
                            )}
                            {!selectedEvent.image_url && <div className="h-4 bg-rift-800" />}

                            <div className="p-8 pt-6">
                                {(() => {
                                    const isFollowed = followedEventIds.has(selectedEvent.id);
                                    return (
                                        <>
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
                                                                <img src={`https://flagcdn.com/w40/${getCountryCode(selectedEvent.country)}.png`} width="24" alt={selectedEvent.country} className="rounded-sm border border-white/10" />
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => handleToggleFollow(selectedEvent.id)}
                                                disabled={isFollowLoading}
                                                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 mb-6 hover:scale-105
                                                    ${isFollowed
                                                        ? 'bg-[#4a9e6d] text-white shadow-[0_0_15px_rgba(74,158,109,0.4)] border-transparent'
                                                        : 'bg-accent-spirit/5 text-accent-spirit border border-accent-spirit/30 hover:bg-accent-spirit/15'}
                                                    ${isFollowLoading ? 'opacity-50 cursor-wait' : ''}
                                                `}
                                            >
                                                <svg className="w-3.5 h-3.5" fill={isFollowed ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                </svg>
                                                {isFollowed ? 'Alerte active' : 'Alerte e-mail'}
                                            </button>
                                        </>
                                    );
                                })()}

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
                                                <p className="font-semibold">
                                                    {(() => {
                                                        const getParisTime = (d: Date) => {
                                                            const timeStr = d.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
                                                            const [h, m] = timeStr.split(':');
                                                            return m === '00' ? `${parseInt(h, 10)}h` : `${parseInt(h, 10)}h${m}`;
                                                        };

                                                        const optionsDate: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' };
                                                        const startDate = new Date(selectedEvent.start_date);
                                                        const startDateStr = startDate.toLocaleDateString('fr-FR', optionsDate);
                                                        const sHours = getParisTime(startDate);
                                                        
                                                        const startHasTime = sHours !== '0h' && !selectedEvent.all_day;
                                                        
                                                        if (selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date) {
                                                            const endDate = new Date(selectedEvent.end_date);
                                                            const endDateStr = endDate.toLocaleDateString('fr-FR', optionsDate);
                                                            const eHours = getParisTime(endDate);
                                                            
                                                            if (startDateStr === endDateStr) {
                                                                if (selectedEvent.all_day) {
                                                                    return sHours !== '0h' ? `${startDateStr} (Dès ${sHours})` : startDateStr;
                                                                }
                                                                return `${startDateStr} de ${sHours} à ${eHours}`;
                                                            } else {
                                                                if (selectedEvent.all_day) {
                                                                    return sHours !== '0h' ? `Du ${startDateStr} au ${endDateStr} (Dès ${sHours})` : `Du ${startDateStr} au ${endDateStr}`;
                                                                }
                                                                return `Du ${startDateStr} à ${sHours} au ${endDateStr} à ${eHours}`;
                                                            }
                                                        }

                                                        if (selectedEvent.all_day) {
                                                            return sHours !== '0h' ? `${startDateStr} (Dès ${sHours})` : startDateStr;
                                                        }
                                                        return startHasTime ? `${startDateStr} à ${sHours}` : startDateStr;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-px bg-rift-800/60" />
                                    <div>
                                        <p className="text-[10px] font-bold text-rift-500 uppercase tracking-widest mb-3">Détails</p>
                                        <p className="text-rift-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedEvent.description || "Aucune description fournie."}</p>
                                    </div>
                                    {selectedEvent.url && (
                                        <a
                                            href={selectedEvent.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:scale-[1.02] ${selectedEvent.url.includes('twitch.tv')
                                                ? 'bg-[#9146FF] text-white shadow-[0_0_20px_rgba(145,70,255,0.4)]'
                                                : 'bg-accent-spirit text-rift-950'
                                                }`}
                                        >
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
