interface ClueLuxLogoProps {
  size?: number;
  className?: string;
}

export function ClueLuxLogo({ size = 48, className }: ClueLuxLogoProps) {
  return (
    <svg
      viewBox="0 0 100 80"
      width={size}
      height={size * 0.8}
      className={className}
      aria-label="ClueLux logo"
      role="img"
    >
      <rect x="2" y="60" width="14" height="16" rx="7" fill="#1e1b4b" />
      <rect x="22" y="46" width="14" height="30" rx="7" fill="#312e81" />
      <rect x="42" y="30" width="14" height="46" rx="7" fill="#7C6A2E" />
      <rect x="62" y="14" width="14" height="62" rx="7" fill="#D4A828" />
      <rect x="82" y="0" width="14" height="76" rx="7" fill="#FFD97A" />
    </svg>
  );
}
