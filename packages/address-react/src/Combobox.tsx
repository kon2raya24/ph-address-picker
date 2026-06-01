import { useEffect, useRef, useState } from 'react';
import type { Option } from '@ph-dev-utils/address-core';

export interface ComboboxProps {
  /** Input id — pair with a `<label htmlFor>` for the accessible name. */
  id: string;
  options: Option[];
  /** Selected PSGC code, or null. */
  value: string | null;
  onSelect: (code: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** Used for the listbox status line and option ids. */
  emptyLabel?: string;
}

/**
 * Accessible type-to-filter combobox (WAI-ARIA combobox + listbox pattern).
 * Selection is always by PSGC `code`; the input shows the option `name`.
 * SSR-safe: no `window`/DOM access at module load (effects only run client-side).
 */
export function Combobox({
  id,
  options,
  value,
  onSelect,
  placeholder,
  disabled = false,
  required = false,
  emptyLabel = 'No matches',
}: ComboboxProps) {
  const listboxId = `${id}-listbox`;
  const selected = value ? (options.find((o) => o.code === value) ?? null) : null;
  const selectedName = selected?.name ?? '';

  const [query, setQuery] = useState(selectedName);
  const [open, setOpen] = useState(false);
  // `dirty` = the user has typed since opening. While clean, show the full list
  // (so focusing a field with a selection lets you browse, not just see one match).
  const [dirty, setDirty] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listRef = useRef<HTMLUListElement>(null);

  // Keep the displayed text in sync when the selection changes from outside
  // (cascade reset when a parent level changes, or edit-form hydration).
  useEffect(() => {
    setQuery(selectedName);
    setDirty(false);
  }, [selectedName]);

  // Token-AND match (order-independent): every whitespace-separated token of the
  // query must appear in the name. This makes "cebu city" find the PSA-stored
  // "City of Cebu" — users type the common "X City" form, PSA stores "City of X".
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered =
    open && dirty && tokens.length
      ? options.filter((o) => {
          const hay = o.name.toLowerCase();
          return tokens.every((t) => hay.includes(t));
        })
      : options;

  // Scroll the active option into view as the user arrows through.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    // `scrollIntoView` is absent in some environments (e.g. jsdom) — guard it.
    if (typeof el?.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function openList() {
    if (disabled) return;
    setOpen(true);
    setDirty(false);
    const i = selected ? options.findIndex((o) => o.code === selected.code) : 0;
    setActiveIndex(i >= 0 ? i : 0);
  }

  function close(revert: boolean) {
    setOpen(false);
    setActiveIndex(-1);
    if (revert) {
      setQuery(selectedName);
      setDirty(false);
    }
  }

  function choose(opt: Option) {
    onSelect(opt.code);
    setQuery(opt.name);
    setDirty(false);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) return openList();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) return openList();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Enter':
        if (open && activeIndex >= 0 && filtered[activeIndex]) {
          e.preventDefault();
          choose(filtered[activeIndex]);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          close(true);
        }
        break;
      case 'Tab':
        close(true);
        break;
    }
  }

  const activeId =
    open && activeIndex >= 0 && filtered[activeIndex]
      ? `${id}-opt-${filtered[activeIndex].code}`
      : undefined;

  return (
    <div className="ph-ap__combobox">
      <input
        id={id}
        className="ph-ap__input ph-ap__combobox-input"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        required={required}
        onFocus={openList}
        onClick={openList}
        onChange={(e) => {
          setQuery(e.target.value);
          setDirty(true);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => close(true)}
      />
      {open && (
        <ul ref={listRef} id={listboxId} role="listbox" className="ph-ap__listbox">
          {filtered.length === 0 ? (
            <li className="ph-ap__option ph-ap__option--empty" role="presentation">
              {emptyLabel}
            </li>
          ) : (
            filtered.map((o, idx) => (
              <li
                key={o.code}
                id={`${id}-opt-${o.code}`}
                role="option"
                aria-selected={o.code === value}
                className={`ph-ap__option${idx === activeIndex ? ' ph-ap__option--active' : ''}`}
                // mousedown (not click) so selection lands before the input blurs.
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
              >
                {o.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
