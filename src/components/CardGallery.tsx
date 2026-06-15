import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// ─── Types ──────────────────────────────────────────────
interface Card {
  id: string;
  collectorNumber: number;
  publicCode: string;
  name: string;
  domain: string;
  type: string;
  cost: number;
  power: number | null;
  might: number | null;
  rarity: string;
  set: string;
  description: string;
  plainDescription: string;
  image: string;
  orientation: string;
  artist?: string;
}

type SortOption = 'number-asc' | 'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc' | 'domain';

// ─── Constants ──────────────────────────────────────────
const DOMAINS = [
  { key: 'fury',  label: 'Fury',  color: '#c22e2e' },
  { key: 'calm',  label: 'Calm',  color: '#4a9e6d' },
  { key: 'mind',  label: 'Mind',  color: '#4a7ec9' },
  { key: 'body',  label: 'Body',  color: '#d48a3c' },
  { key: 'chaos', label: 'Chaos', color: '#8a4ec9' },
  { key: 'order', label: 'Order', color: '#fabc2a' },
  { key: 'colorless', label: 'Colorless', color: '#7a8599' },
] as const;

const TYPES = ['Champion', 'Unit', 'Spell', 'Battlefield', 'Gear', 'Rune', 'Legend'] as const;
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Showcase'] as const;

const DOMAIN_COLOR_MAP: Record<string, string> = {
  fury:  '#c22e2e',
  calm:  '#4a9e6d',
  mind:  '#4a7ec9',
  body:  '#d48a3c',
  chaos: '#8a4ec9',
  order: '#fabc2a',
  colorless: '#7a8599',
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'number-asc', label: 'Numéro' },
  { value: 'name-asc',  label: 'Nom (A → Z)' },
  { value: 'name-desc', label: 'Nom (Z → A)' },
  { value: 'cost-asc',  label: 'Coût (croissant)' },
  { value: 'cost-desc', label: 'Coût (décroissant)' },
  { value: 'domain',    label: 'Domaine' },
];

// ─── Description Parser Helper ──────────
function parseCardDescription(html: string): string {
  if (!html) return '';
  let processed = html;

  // 1. Energy Icons: :rb_energy_3: -> <span class="icon-energy">3</span>
  processed = processed.replace(/:rb_energy_(\d+):/g, '<span class="icon-energy">$1</span>');

  // 2. Rune Icons: :rb_rune_fury: -> <img src="/assets/icons/fury.png" class="icon-tcg" alt="fury" />
  processed = processed.replace(/:rb_rune_([a-zA-Z0-9_-]+):/g, (match, rune) => {
    const r = rune.toLowerCase();
    const filename = r === 'rainbow' ? 'power' : r;
    return `<img src="/assets/icons/${filename}.png" class="icon-tcg" alt="${rune}" />`;
  });

  // 3. Might Icon: :rb_might: -> <img src="/assets/icons/Might.png" class="icon-tcg" alt="might" />
  processed = processed.replace(/:rb_might:/g, '<img src="/assets/icons/Might.png" class="icon-tcg" alt="might" />');

  // 4. Exhaust Icon: :rb_exhaust: -> <img src="/assets/icons/exhaust.png" class="icon-tcg" alt="exhaust" />
  processed = processed.replace(/:rb_exhaust:/g, '<img src="/assets/icons/exhaust.png" class="icon-tcg" alt="exhaust" />');

  // 5. Keyword highlighting [Keyword] -> <strong>[$1]</strong>
  processed = processed.replace(/\[([^\]]+)\]/g, '<strong>[$1]</strong>');

  return processed;
}

// ─── Component ──────────────────────────────────────────
interface CardGalleryProps {
  cards: Card[];
}

export default function CardGallery({ cards }: CardGalleryProps) {
  // ── Filters State ─────────────────────
  const [search, setSearch] = useState('');
  const [activeDomains, setActiveDomains] = useState<Set<string>>(new Set());
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [activeRarities, setActiveRarities] = useState<Set<string>>(new Set());
  const [activeCosts, setActiveCosts] = useState<Set<number>>(new Set());
  const [activeSet, setActiveSet] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('number-asc');

  // ── Pagination State ──────────────────
  const [displayLimit, setDisplayLimit] = useState(36);

  // ── Modal State ───────────────────────
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset pagination limit when filters or sorting change
  useEffect(() => {
    setDisplayLimit(36);
  }, [search, activeDomains, activeTypes, activeRarities, activeCosts, activeSet, sort]);

  // ── Unique costs from data ────────────
  const availableCosts = useMemo(() => {
    const costs = new Set(cards.map(c => c.cost));
    return Array.from(costs).sort((a, b) => a - b);
  }, [cards]);

  // ── Unique sets from data ─────────────
  const availableSets = useMemo(() => {
    const sets = new Set(cards.map(c => c.set));
    return Array.from(sets).filter(Boolean).sort();
  }, [cards]);

  // ── Filter logic ──────────────────────
  const filteredCards = useMemo(() => {
    let result = cards;

    // Search (plainDescription is used to avoid matching inline HTML tags)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.plainDescription && c.plainDescription.toLowerCase().includes(q))
      );
    }

    // Domain
    if (activeDomains.size > 0) {
      result = result.filter(c => activeDomains.has(c.domain));
    }

    // Type
    if (activeTypes.size > 0) {
      result = result.filter(c => activeTypes.has(c.type));
    }

    // Rarity
    if (activeRarities.size > 0) {
      result = result.filter(c => activeRarities.has(c.rarity));
    }

    // Cost
    if (activeCosts.size > 0) {
      result = result.filter(c => activeCosts.has(c.cost));
    }

    // Set
    if (activeSet !== 'all') {
      result = result.filter(c => c.set === activeSet);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'number-asc': return a.collectorNumber - b.collectorNumber;
        case 'name-asc':  return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'cost-asc':  return a.cost - b.cost;
        case 'cost-desc': return b.cost - a.cost;
        case 'domain':    return a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return result;
  }, [cards, search, activeDomains, activeTypes, activeRarities, activeCosts, activeSet, sort]);

  // ── Toggle helpers ────────────────────
  const toggleSet = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  const hasActiveFilters = search.trim() || activeDomains.size > 0 || activeTypes.size > 0 || activeRarities.size > 0 || activeCosts.size > 0 || activeSet !== 'all';

  const clearFilters = () => {
    setSearch('');
    setActiveDomains(new Set());
    setActiveTypes(new Set());
    setActiveRarities(new Set());
    setActiveCosts(new Set());
    setActiveSet('all');
  };

  // ── Modal logic ───────────────────────
  const openModal = useCallback((card: Card) => {
    setSelectedCard(card);
    setIsModalClosing(false);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedCard(null);
      setIsModalClosing(false);
      document.body.style.overflow = '';
    }, 250);
  }, []);

  const navigateCard = useCallback((direction: 1 | -1) => {
    if (!selectedCard) return;
    const idx = filteredCards.findIndex(c => c.id === selectedCard.id);
    if (idx === -1) return;
    const nextIdx = (idx + direction + filteredCards.length) % filteredCards.length;
    setSelectedCard(filteredCards[nextIdx]);
  }, [selectedCard, filteredCards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedCard) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') navigateCard(-1);
      if (e.key === 'ArrowRight') navigateCard(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCard, closeModal, navigateCard]);

  // ── Render ────────────────────────────
  return (
    <div>
      {/* ═══ FILTER BAR ═══ */}
      <div className="card-gallery-filters">
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <svg
            style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#627d98" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="card-search-input"
            placeholder="Rechercher une carte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="card-search"
          />
        </div>

        {/* Filter rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Domain */}
          <div className="filter-section">
            <span className="filter-label">Domaine</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {DOMAINS.map(d => (
                <button
                  key={d.key}
                  className={`domain-pill${activeDomains.has(d.key) ? ' active' : ''}`}
                  style={{ '--domain-color': d.color } as React.CSSProperties}
                  onClick={() => toggleSet(activeDomains, d.key, setActiveDomains)}
                  id={`filter-domain-${d.key}`}
                >
                  <span className="domain-dot" />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="filter-section">
            <span className="filter-label">Type</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {TYPES.map(t => (
                <button
                  key={t}
                  className={`filter-pill${activeTypes.has(t) ? ' active' : ''}`}
                  onClick={() => toggleSet(activeTypes, t, setActiveTypes)}
                  id={`filter-type-${t.toLowerCase()}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rarity */}
          <div className="filter-section">
            <span className="filter-label">Rareté</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {RARITIES.map(r => (
                <button
                  key={r}
                  className={`filter-pill${activeRarities.has(r) ? ' active' : ''}`}
                  onClick={() => toggleSet(activeRarities, r, setActiveRarities)}
                  id={`filter-rarity-${r.toLowerCase()}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Cost */}
          <div className="filter-section">
            <span className="filter-label">Coût (Énergie)</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {availableCosts.map(c => (
                <button
                  key={c}
                  className={`filter-pill${activeCosts.has(c) ? ' active' : ''}`}
                  onClick={() => toggleSet(activeCosts, c, setActiveCosts)}
                  id={`filter-cost-${c}`}
                  style={{ minWidth: '2rem', justifyContent: 'center' }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Sort & Set & Count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              {/* Set filter select */}
              <select
                className="sort-select"
                value={activeSet}
                onChange={(e) => setActiveSet(e.target.value)}
                id="card-set"
              >
                <option value="all">Toutes les extensions</option>
                {availableSets.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Sort By select */}
              <select
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                id="card-sort"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              
              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  ✕ Réinitialiser
                </button>
              )}
            </div>
            <span className="results-count">
              <strong>{filteredCards.length}</strong> / {cards.length} cartes
            </span>
          </div>
        </div>
      </div>

      {/* ═══ CARD GRID ═══ */}
      {filteredCards.length > 0 ? (
        <div>
          <div className="card-grid">
            {filteredCards.slice(0, displayLimit).map((card, i) => (
              <div
                key={card.id}
                className="card-item"
                data-domain={card.domain}
                data-orientation={card.orientation}
                onClick={() => openModal(card)}
                style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
                role="button"
                tabIndex={0}
                aria-label={`Voir ${card.name}`}
                onKeyDown={(e) => e.key === 'Enter' && openModal(card)}
              >
                <div className="card-image-wrapper">
                  <img
                    src={card.image}
                    alt={card.name}
                    loading="lazy"
                    draggable={false}
                  />
                </div>
                <div className="card-name-label">{card.name}</div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {filteredCards.length > displayLimit && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
              <button 
                className="filter-pill active" 
                onClick={() => setDisplayLimit(prev => prev + 36)}
                style={{ padding: '0.625rem 2rem', fontSize: '0.8rem', fontWeight: 600, color: '#f0f4f8' }}
              >
                Charger plus de cartes
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <div className="no-results-title">Aucune carte trouvée</div>
          <p>Essayez de modifier vos filtres ou votre recherche.</p>
        </div>
      )}

      {/* ═══ CARD DETAIL MODAL ═══ */}
      {selectedCard && (
        <div
          className={`card-modal-overlay${isModalClosing ? ' closing' : ''}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Détails de ${selectedCard.name}`}
        >
          {/* Close */}
          <button className="modal-close-btn" onClick={closeModal} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {/* Prev */}
          <button className="modal-nav-btn prev" onClick={() => navigateCard(-1)} aria-label="Carte précédente">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Next */}
          <button className="modal-nav-btn next" onClick={() => navigateCard(1)} aria-label="Carte suivante">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Content */}
          <div className="card-modal-content">
            {/* Image */}
            <div 
              className="modal-card-image" 
              data-orientation={selectedCard.orientation}
              style={{ boxShadow: `0 20px 60px ${DOMAIN_COLOR_MAP[selectedCard.domain] || '#000'}33` }}
            >
              <img src={selectedCard.image} alt={selectedCard.name} draggable={false} />
            </div>

            {/* Details */}
            <div className="modal-details">
              <h2 className="modal-card-name">{selectedCard.name}</h2>

              {/* Domain Badge */}
              <div
                className="modal-domain-badge"
                style={{ background: DOMAIN_COLOR_MAP[selectedCard.domain] || '#627d98' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
                {selectedCard.domain.charAt(0).toUpperCase() + selectedCard.domain.slice(1)}
              </div>

              {/* Stats Grid */}
              <div className="modal-stats-grid">
                <div className="modal-stat">
                  <div className="modal-stat-label">Type</div>
                  <div className="modal-stat-value">{selectedCard.type}</div>
                </div>
                <div className="modal-stat">
                  <div className="modal-stat-label">Énergie</div>
                  <div className="modal-stat-value" style={{ color: '#E9870F' }}>{selectedCard.cost}</div>
                </div>
                {selectedCard.power !== null && (
                  <div className="modal-stat">
                    <div className="modal-stat-label">Power</div>
                    <div className="modal-stat-value" style={{ color: '#ef4444' }}>{selectedCard.power}</div>
                  </div>
                )}
                {selectedCard.might !== null && (
                  <div className="modal-stat">
                    <div className="modal-stat-label">Might</div>
                    <div className="modal-stat-value" style={{ color: '#22c55e' }}>{selectedCard.might}</div>
                  </div>
                )}
                <div className="modal-stat">
                  <div className="modal-stat-label">Rareté</div>
                  <div className="modal-stat-value" style={{ fontSize: '0.85rem' }}>{selectedCard.rarity}</div>
                </div>
                <div className="modal-stat">
                  <div className="modal-stat-label">Extension</div>
                  <div className="modal-stat-value" style={{ fontSize: '0.85rem' }}>{selectedCard.set}</div>
                </div>
              </div>

              {/* Description */}
              <div className="modal-description" dangerouslySetInnerHTML={{ __html: parseCardDescription(selectedCard.description) }} />

              {/* Artist */}
              {selectedCard.artist && (
                <div style={{ fontSize: '0.75rem', color: '#627d98', marginTop: '1rem', fontStyle: 'italic' }}>
                  Illustré par : {selectedCard.artist}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

