import { motion } from 'framer-motion'
import { WellpharmaLogo } from './WellpharmaLogo'
import { LigneDeVieAnimee } from './LigneDeVieAnimee'

/** Écran de lancement : la ligne de vie se dessine, puis le logo éclôt. */
export function BrandSplash() {
  return (
    <div className="splash">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <LigneDeVieAnimee width={220} loop={false} />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
        >
          <WellpharmaLogo height={132} />
        </motion.div>
      </div>
    </div>
  )
}
