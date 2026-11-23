interface ChurchLogoProps {
  className?: string;
}

export function ChurchLogo({ className = 'w-7 h-7' }: ChurchLogoProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 31V17C6 10.3726 11.3726 5 18 5C24.6274 5 30 10.3726 30 17V31"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M4 31H32" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M18 11V25" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M13.5 16H22.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
