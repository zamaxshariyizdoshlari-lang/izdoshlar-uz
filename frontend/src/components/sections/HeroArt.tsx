// Hero uchun original illyustratsiya: maktab paneli (dars jadvali + statistika) va bot suhbati.
// Bu haqiqiy skrinshot emas, sxematik tasvir. Haqiqiy mahsulot skrinshoti bilan almashtirish mumkin.
export function HeroArt({ className = '' }: { className?: string }) {
  const cell = (x: number, y: number, tone: string, w = 52) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={w} height={22} rx={7} className={tone} />
  )
  return (
    <svg viewBox="0 0 520 440" role="img" aria-label="Maktab boshqaruv paneli va Telegram bot suhbati namunasi" className={className}>
      {/* Orqa dumaloq shakllar */}
      <circle cx="430" cy="70" r="70" className="fill-sun-400/40" />
      <circle cx="60" cy="380" r="56" className="fill-leaf-100" />

      {/* Brauzer oynasi */}
      <g className="animate-float">
        <rect x="40" y="50" width="380" height="290" rx="22" className="fill-white stroke-line" strokeWidth="2" />
        <path d="M40 72a22 22 0 0 1 22-22h336a22 22 0 0 1 22 22v18H40z" className="fill-brand-50" />
        <circle cx="64" cy="70" r="5" className="fill-brand-400" />
        <circle cx="82" cy="70" r="5" className="fill-sun-400" />
        <circle cx="100" cy="70" r="5" className="fill-leaf-500" />

        {/* Yon menyu */}
        <rect x="58" y="108" width="70" height="14" rx="7" className="fill-brand-500" />
        <rect x="58" y="134" width="56" height="12" rx="6" className="fill-line" />
        <rect x="58" y="156" width="64" height="12" rx="6" className="fill-line" />
        <rect x="58" y="178" width="48" height="12" rx="6" className="fill-line" />

        {/* Dars jadvali */}
        <rect x="148" y="108" width="90" height="12" rx="6" className="fill-ink-700/70" />
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3].map((c) => {
            const tones = ['fill-brand-100', 'fill-leaf-100', 'fill-sun-100', 'fill-brand-200']
            return cell(148 + c * 58, 132 + r * 28, tones[(r * 3 + c * 2) % 4])
          }),
        )}
        <rect x="206" y="160" width="52" height="22" rx="7" className="fill-brand-500" />

        {/* Davomat statistikasi */}
        <rect x="148" y="252" width="90" height="12" rx="6" className="fill-ink-700/70" />
        {[34, 52, 40, 64, 48, 70, 58].map((h, i) => (
          <rect key={i} x={150 + i * 20} y={330 - h} width="13" height={h} rx="5" className={i === 5 ? 'fill-brand-500' : 'fill-leaf-500/70'} />
        ))}
      </g>

      {/* Bot suhbati */}
      <g className="animate-float" style={{ animationDelay: '1.2s' }}>
        <rect x="290" y="236" width="200" height="150" rx="20" className="fill-white stroke-line" strokeWidth="2" />
        <rect x="306" y="254" width="124" height="30" rx="14" className="fill-brand-50" />
        <rect x="320" y="265" width="84" height="8" rx="4" className="fill-brand-400" />
        <rect x="346" y="296" width="128" height="30" rx="14" className="fill-leaf-500" />
        <rect x="360" y="307" width="92" height="8" rx="4" className="fill-white/90" />
        <rect x="306" y="338" width="96" height="30" rx="14" className="fill-brand-50" />
        <rect x="320" y="349" width="62" height="8" rx="4" className="fill-brand-400" />
      </g>

      {/* "Tayyor" belgisi */}
      <g className="animate-float" style={{ animationDelay: '0.6s' }}>
        <circle cx="430" cy="150" r="30" className="fill-leaf-500" />
        <path d="M416 150l10 10 20-22" fill="none" className="stroke-white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
