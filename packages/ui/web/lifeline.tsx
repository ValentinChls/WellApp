import * as React from 'react'
import { brand } from '../tokens/colors'

/**
 * « Ligne de vie » — asset graphique signature du groupement Wellpharma
 * (cf. charte, p.15). Élément fondamental de l'identité visuelle.
 * Version web/SVG. (Une variante RN pourra utiliser react-native-svg.)
 */
export function LifeLine({
  color = brand.primary,
  width = 240,
  height = 40,
  align = 'center',
  strokeWidth = 1.6,
  ...props
}: React.SVGProps<SVGSVGElement> & { align?: 'left' | 'center' | 'right' }) {
  // La boucle nouée ("le battement") : la ligne dessine une petite boucle qui
  // se croise et passe SOUS la ligne, puis repart à l'horizontale.
  const loopX = align === 'left' ? 64 : align === 'right' ? 176 : 120
  return (
    <svg
      viewBox="0 0 240 40"
      width={width}
      height={height}
      fill="none"
      role="img"
      aria-label="Ligne de vie Wellpharma"
      {...props}
    >
      <path
        d={`M0 19 H${loopX - 9} C ${loopX + 34} 37 ${loopX - 34} 37 ${loopX + 9} 19 H240`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
