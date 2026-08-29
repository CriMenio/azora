import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown } from 'lucide-react';

export default function UiSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  className = '',
  id: idProp,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const autoId = useId();
  const id = idProp || autoId;

  const selected = options.find((option) => String(option.value) === String(value));
  const label = selected?.label ?? placeholder;

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

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
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
        <ul className="ui-select-menu" role="listbox" aria-labelledby={id}>
          {options.map((option) => {
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
          })}
        </ul>
      )}
    </div>
  );
}
