const PATHS: Record<string, string> = {
  book: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17zM4 19.5A2.5 2.5 0 0 1 6.5 17H20",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v5l3 2",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  back: "M15 5l-7 7 7 7",
  chevron: "M9 5l7 7-7 7",
  star: "M12 3l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.4l-5.7 3.1 1.2-6.4L2.8 9.7l6.4-.8L12 3z",
  check: "M5 12l5 5L20 7",
  x: "M6 6l12 12M18 6L6 18",
  speaker: "M4 9v6h4l5 4V5L8 9H4zm12 0a4 4 0 0 1 0 6m2.5-9a7.5 7.5 0 0 1 0 12",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-18c3 3 3 15 0 18m0-18c-3 3-3 15 0 18M3 12h18",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm-2.5-11a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7m0 3h.01",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 8h.01",
  share: "M12 3v12m0-12L8 7m4-4l4 4M5 13v6h14v-6",
  flag: "M5 21V4h11l-1 4 1 4H5",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-15v2m0 16v2M4 12H2m20 0h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z",
  download: "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14",
  upload: "M12 15V3m0 0L8 7m4-4l4 4M5 21h14",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  grid: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z",
  bolt: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  repeat: "M4 10a8 8 0 0 1 14-4l2 2m0-5v5h-5M20 14a8 8 0 0 1-14 4l-2-2m0 5v-5h5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-10v5m0-8h.01",
  search: "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zm5.5-2l5 5",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4zm-3 1h3v3a3 3 0 0 1-3-3zm14 0h-3v3a3 3 0 0 0 3-3zM12 13v4m-4 4h8",
  history: "M3 12a9 9 0 1 0 3-6.7M3 3v5h5m4 0v5l3 2",
  shuffle: "M4 6h3l10 12h3m0-12h-3l-2 2.4M4 18h3l2-2.4M18 4l3 2-3 2m0 8l3 2-3 2",
  zap: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
};

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const d = PATHS[name] ?? PATHS.info;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
