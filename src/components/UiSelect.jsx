import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function UiSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  searchable,
  searchPlaceholder = 'Type to search services...',
  className = '',
  id: idProp,
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);
  const autoId = useId();
  const id = idProp || autoId;

  // Auto-enable search if there are more than 7 options or if explicitly requested
  const isSearchable = searchable !== undefined ? Boolean(searchable) : options.length > 7;

  const selected = options.find((option) => String(option.value) === String(value));
  const label = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return undefined;
    }

    if (isSearchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [open, isSearchable]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((option) =>
      String(option.label || '').toLowerCase().includes(q) ||
      String(option.value || '').toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div
      ref={rootRef}
      className={`ui-select ${open ? 'is-open' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        id={id}
        className="ui-select-trigger form-control"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`ui-select-value ${!selected ? 'is-placeholder' : ''}`}>
          {label}
        </span>
        <ChevronDown size={18} className="ui-select-chevron" aria-hidden />
      </button>

      {open && (
        <div className="ui-select-dropdown">
          {isSearchable && (
            <div className="ui-select-search-wrap" onClick={(e) => e.stopPropagation()}>
              <Search size={16} className="ui-select-search-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                className="ui-select-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                  } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredOptions[0].value);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="ui-select-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <ul className="ui-select-menu" role="listbox" aria-labelledby={id}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = String(option.value) === String(value);

                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`ui-select-option ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => handleSelect(option.value)}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="ui-select-no-results">
                No matching services found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

