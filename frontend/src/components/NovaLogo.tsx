import type { SVGProps } from 'react'

/**
 * Фирменный символ Nova:
 * - 4-лучевая звезда-маяк с плавными вогнутыми дугами в золотом спектре (как на фото)
 * - Эллиптическое кольцо орбиты
 * - На топбаре: точка СТАТИЧНА (isStatic = true), вокруг звезды ничего не крутится
 * - В Hero-секции: спутник плавно и медленно движется по орбите (duration = 28s),
 *   исчезая за телом звезды при прохождении задней фазы
 */
export function NovaSymbol({
  size = 32,
  className = '',
  duration = '28s',
  isStatic = false,
  ...props
}: {
  size?: number
  className?: string
  duration?: string
  isStatic?: boolean
} & SVGProps<SVGSVGElement>) {
  const uniqueId = `nova-sym-${Math.round(size)}-${isStatic ? 'st' : 'dyn'}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`nova-symbol-anim ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      {...props}
    >
      <defs>
        {/* Тёплая золотая аура свечения в центре звезды */}
        <radialGradient id={`starAura-${uniqueId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>

        {/* Фирменный градиент звезды Nova */}
        <linearGradient id={`goldGrad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="20%" stopColor="#FBBF24" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Замкнутый путь эллипса орбиты:
            Центр: cx = 250, cy = 275, rx = 205, ry = 64
        */}
        <path
          id={`path-${uniqueId}`}
          d="M 455, 275 A 205 64 0 0 0 45, 275 A 205 64 0 0 0 455, 275"
          fill="none"
        />
      </defs>

      {/* 1. Тёплая аура свечения в центре */}
      <circle cx="250" cy="250" r="150" fill={`url(#starAura-${uniqueId})`} />

      {/* 2. Дальняя дуга кольца орбиты (проходит ЗА телом звезды) */}
      <path
        d="M 45, 275 A 205 64 0 0 1 455 275"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* 3. Спутник в задней фазе (скрывается за звездой при прохождении задней дуги) */}
      {!isStatic && (
        <g>
          <animateMotion dur={duration} repeatCount="indefinite" rotate="auto">
            <mpath href={`#path-${uniqueId}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="1;1;0;0;1"
            keyTimes="0;0.499;0.5;0.999;1"
            dur={duration}
            repeatCount="indefinite"
          />
          <circle r="11" fill="#FEF3C7" />
        </g>
      )}

      {/* 4. Звезда-маяк: классическая геометрия 4-лучевой звезды Nova с фото */}
      <path
        d="M 250, 45 C 257, 195 295, 243 455, 250 C 295, 257 257, 305 250, 455 C 243, 305 205, 257 45, 250 C 205, 243 243, 195 250, 45 Z"
        fill={`url(#goldGrad-${uniqueId})`}
      />

      {/* 5. Ближняя дуга кольца орбиты (проходит ПЕРЕД нижним лучом звезды) */}
      <path
        d="M 455, 275 A 205 64 0 0 1 45, 275"
        stroke="rgba(255, 255, 255, 0.95)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />

      {/* 6. Спутник:
          - Если isStatic: фиксированная статичная точка на орбите (как на фото)
          - Если динамический: движется по ближней дуге ПОВЕРХ луча звезды
      */}
      {isStatic ? (
        <circle cx="375" cy="318" r="11" fill="#FEF3C7" />
      ) : (
        <g>
          <animateMotion dur={duration} repeatCount="indefinite" rotate="auto">
            <mpath href={`#path-${uniqueId}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0;1;1;0"
            keyTimes="0;0.499;0.5;0.999;1"
            dur={duration}
            repeatCount="indefinite"
          />
          <circle r="11" fill="#FEF3C7" />
        </g>
      )}
    </svg>
  )
}

/** Совместимый алиас */
export const NovaStar = NovaSymbol

/**
 * Большая фигура для Hero-секции:
 * Использует геометрию звезды с плавным обращением спутника и окклюзией
 */
export function NovaBeaconOrbit({
  width = 460,
  size,
  className = '',
  ...props
}: {
  width?: number
  size?: number
  className?: string
} & SVGProps<SVGSVGElement>) {
  const finalSize = size || width || 460

  return (
    <div
      className={`nova-beacon-container ${className}`}
      style={{
        width: finalSize,
        height: finalSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <NovaSymbol size={finalSize} duration="28s" isStatic={false} {...props} />
    </div>
  )
}

/**
 * Полный логотип:
 * Для топбара:
 * - isStatic = true (точка статична, не вращается)
 * - monochromeAi = true (надпись NOVA AI полностью одноцветная, буква A не подкрашивается)
 */
export function NovaLogo({
  size = 28,
  className = '',
  monochromeAi = false,
  isStatic = false,
}: {
  size?: number
  className?: string
  monochromeAi?: boolean
  isStatic?: boolean
}) {
  return (
    <div
      className={`nova-brand-lockup ${className}`}
      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
    >
      <NovaSymbol size={size} isStatic={isStatic} />
      <div className="nova-brand-text">
        <span className="brand-word">NOVA</span>
        {monochromeAi ? (
          <span className="brand-word-ai-mono">AI</span>
        ) : (
          <span className="brand-word-ai">
            <span className="letter-a">A</span>I
          </span>
        )}
      </div>
    </div>
  )
}
