import { motion, useReducedMotion } from 'framer-motion'

/**
 * « Ligne de vie » VIVANTE — signature de marque animée (SVG).
 * Le trait se dessine (pathLength), puis un point de lumière le parcourt
 * en boucle (le « pouls »). Respecte prefers-reduced-motion (trait statique).
 * Évocation vectorielle de l'asset de marque (ligne + battement cardiaque) ;
 * le logo exact reste le PNG officiel (WellpharmaLogo).
 */
const PATH =
  'M2 34 C 34 34 52 33 72 33 C 90 33 98 33 105 33 C 110 33 113 11 120 30 C 125 45 131 7 138 31 C 143 46 150 33 168 33 C 198 33 214 33 238 33'

export function LigneDeVieAnimee({
  width = 220,
  color = 'var(--wp-primary, #009dc5)',
  strokeWidth = 3,
  pulse = true,
  loop = true,
}: {
  width?: number
  color?: string
  strokeWidth?: number
  pulse?: boolean
  loop?: boolean
}) {
  const reduce = useReducedMotion()
  const height = Math.round((width / 240) * 60)

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 240 60"
      fill="none"
      role="img"
      aria-label="Wellpharma — ligne de vie"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <motion.path
        d={PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.35 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3 },
        }}
      />
      {pulse && !reduce ? (
        <motion.circle
          r={4}
          fill={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0], offsetDistance: ['0%', '100%'] }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            delay: 1.4,
            repeat: loop ? Infinity : 0,
            repeatDelay: 1.4,
          }}
          style={{ offsetPath: `path('${PATH}')`, filter: 'drop-shadow(0 0 6px currentColor)' }}
        />
      ) : null}
    </svg>
  )
}
