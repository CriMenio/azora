import azoraLogo from '../assets/AzoraLogo.png';

const SIZES = {
  header: 52,
  footer: 52,
  admin: 38,
  bill: 58,
  hero: 110,
};

export default function Logo({
  variant = 'header',
  className = '',
  showAdminLabel = false,
  alt = 'Azora Salon & Spa',
}) {
  const height = SIZES[variant] || SIZES.header;

  return (
    <span className={`azora-logo-wrap azora-logo--${variant} ${className}`.trim()}>
      <img
        src={azoraLogo}
        alt={alt}
        className="azora-logo-img"
        height={height}
        style={{ height }}
      />
      {showAdminLabel && <span className="azora-logo-admin-label">Admin</span>}
    </span>
  );
}
