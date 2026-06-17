/**
 * « Ligne de vie » — asset signature OFFICIEL de Wellpharma.
 * Utilise directement les fichiers fournis (public/brand/ligne-de-vie-1|2.png)
 * pour un rendu exact. Variante 1 = boucle à gauche, variante 2 = boucle à droite.
 *
 * Les PNG ont un fond blanc : `mix-blend-mode: multiply` le neutralise sur les
 * fonds clairs (la ligne teal reste intacte) — à n'utiliser que sur surfaces claires.
 */
export function LigneDeVie({
  variant = 1,
  width = 132,
  className,
}: {
  variant?: 1 | 2
  width?: number
  className?: string
}) {
  return (
    <img
      src={`/brand/ligne-de-vie-${variant}.png`}
      alt=""
      aria-hidden="true"
      width={width}
      className={className}
      style={{ display: 'block', height: 'auto', mixBlendMode: 'multiply' }}
    />
  )
}
