type MascotMood = 'curious' | 'bright' | 'thinking' | 'celebrate';

type MascotProps = {
  mood?: MascotMood;
  size?: number;
  className?: string;
  label?: string;
};

export function Mascot({ mood = 'curious', size = 152, className = '', label = 'Pip the field scout' }: MascotProps) {
  return (
    <svg
      className={`pip-mascot pip-${mood} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 220 220"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="111" cy="198" rx="54" ry="9" fill="#163B51" opacity=".12" />
      <path d="M62 155c-14 6-23 18-22 31 1 7 9 10 15 5l27-20" fill="#D9824B" stroke="#153B50" strokeWidth="5" strokeLinejoin="round" />
      <path d="M57 147c-6-19-4-40 7-57 10-16 28-26 48-26 29 0 51 21 55 49 3 22-4 41-17 55l-5 27c-1 7-7 12-14 12H81c-7 0-13-5-14-12l-5-24" fill="#F0B65F" stroke="#153B50" strokeWidth="5" strokeLinejoin="round" />
      <path d="M76 73 67 32c-2-9 8-14 15-8l31 26" fill="#F0B65F" stroke="#153B50" strokeWidth="5" strokeLinejoin="round" />
      <path d="m137 50 31-26c7-6 17-1 15 8l-9 41" fill="#F0B65F" stroke="#153B50" strokeWidth="5" strokeLinejoin="round" />
      <path d="m78 50 27 15-27 8Z" fill="#D9824B" />
      <path d="m161 49-27 17 27 7Z" fill="#D9824B" />
      <path d="M61 113c8-25 29-41 51-41 24 0 45 15 54 39-8 16-19 27-34 32-22 7-47 1-63-13-5-5-8-10-8-17Z" fill="#1C5263" stroke="#153B50" strokeWidth="4" strokeLinejoin="round" />
      <path d="M75 105c6-8 14-12 23-10 6 2 9 7 9 13-1 7-7 11-15 10-8-1-14-5-17-13Z" fill="#F7E8C8" />
      <path d="M126 108c2-8 8-13 16-13 8 0 15 5 19 13-4 8-10 12-18 12-10 0-16-5-17-12Z" fill="#F7E8C8" />
      <ellipse cx="94" cy="108" rx="4.5" ry="6" fill="#153B50" />
      <ellipse cx="145" cy="108" rx="4.5" ry="6" fill="#153B50" />
      <path d="M119 121c-3 0-6 3-6 6 0 3 3 5 6 5s6-2 6-5-3-6-6-6Z" fill="#D9824B" stroke="#153B50" strokeWidth="3" />
      {mood === 'thinking' ? <path d="M112 141c6-4 13-4 19 0" fill="none" stroke="#153B50" strokeWidth="3.5" strokeLinecap="round" /> : <path d="M108 139c7 8 17 8 24 0" fill="none" stroke="#153B50" strokeWidth="3.5" strokeLinecap="round" />}
      <path d="M81 80c6-5 13-6 20-3M135 77c7-3 14-1 19 4" fill="none" stroke="#153B50" strokeWidth="4" strokeLinecap="round" />
      <path d="M62 153c17-10 34-12 53-7 19 5 33 3 48-8l-4 19c-13 12-33 17-51 11-15-5-28-3-41 7Z" fill="#D9824B" stroke="#153B50" strokeWidth="4" strokeLinejoin="round" />
      <path d="M81 166v25m52-11v11" stroke="#153B50" strokeWidth="5" strokeLinecap="round" />
      <path d="M62 78c-14-7-20-18-17-28 12 3 20 9 25 18" fill="#6C9A8D" stroke="#153B50" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="183" cy="74" r="13" fill="#F7E8C8" stroke="#153B50" strokeWidth="4" />
      <circle cx="183" cy="74" r="5" fill="#D9824B" />
      {mood === 'celebrate' && <path d="m43 87 5-10m124-16 7-9M66 43l-4-10m109 94 10 1" stroke="#D9824B" strokeWidth="4" strokeLinecap="round" />}
      {mood === 'thinking' && <circle cx="188" cy="42" r="5" fill="#D9824B" />}
    </svg>
  );
}
