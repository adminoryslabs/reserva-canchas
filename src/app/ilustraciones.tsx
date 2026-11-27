// Ilustraciones provisionales de design/assets/ (no son marca definitiva).
export function Balon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#fff" stroke="#0b5d34" strokeWidth="2" />
      <polygon points="16,9 21,12.7 19,18.5 13,18.5 11,12.7" fill="#0b5d34" />
      <g stroke="#0b5d34" strokeWidth="1.6">
        <line x1="16" y1="9" x2="16" y2="3" />
        <line x1="21" y1="12.7" x2="27" y2="10.5" />
        <line x1="19" y1="18.5" x2="23" y2="24" />
        <line x1="13" y1="18.5" x2="9" y2="24" />
        <line x1="11" y1="12.7" x2="5" y2="10.5" />
      </g>
    </svg>
  );
}

export function CanchaFulbito() {
  return (
    <svg className="ilustracion" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 110" role="img" aria-label="Cancha de fulbito">
      <rect width="200" height="110" rx="10" fill="#1f9d5c" />
      <g fill="none" stroke="#fff" strokeWidth="2" opacity=".85">
        <rect x="10" y="10" width="180" height="90" />
        <line x1="100" y1="10" x2="100" y2="100" />
        <circle cx="100" cy="55" r="14" />
        <rect x="10" y="33" width="22" height="44" />
        <rect x="168" y="33" width="22" height="44" />
      </g>
    </svg>
  );
}

export function CanchaVoley() {
  return (
    <svg className="ilustracion" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 110" role="img" aria-label="Cancha de vóley">
      <rect width="200" height="110" rx="10" fill="#e08a2c" />
      <g fill="none" stroke="#fff" strokeWidth="2" opacity=".9">
        <rect x="10" y="10" width="180" height="90" />
        <line x1="100" y1="6" x2="100" y2="104" strokeWidth="4" />
        <line x1="67" y1="10" x2="67" y2="100" />
        <line x1="133" y1="10" x2="133" y2="100" />
      </g>
    </svg>
  );
}
