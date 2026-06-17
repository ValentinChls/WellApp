import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import { AppShell } from './components/AppShell'
import { BrandSplash } from './components/BrandSplash'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { SearchPage } from './pages/SearchPage'
import { PharmacyDetailPage } from './pages/PharmacyDetailPage'
import { SoinsPage } from './pages/SoinsPage'
import { ConseilPage } from './pages/ConseilPage'
import { RendezVousPage } from './pages/RendezVousPage'
import { EntretiensPage } from './pages/EntretiensPage'
import { EntretienFormPage } from './pages/EntretienFormPage'
import { CalendrierPage } from './pages/CalendrierPage'
import { AssistantPage } from './pages/AssistantPage'
import { PreventionPage } from './pages/PreventionPage'
import { ProfilPage } from './pages/ProfilPage'
import { MissionsPage } from './pages/MissionsPage'
import { MissionRunPage } from './pages/MissionRunPage'
import { FidelitePage } from './pages/FidelitePage'
import { MaSantePage } from './pages/MaSantePage'

export function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return <BrandSplash />
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Parcours de mission : plein écran immersif (hors nav basse). */}
      <Route
        path="/missions/:id"
        element={session ? <MissionRunPage /> : <Navigate to="/login" replace />}
      />

      <Route element={session ? <AppShell /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pharmacies" element={<SearchPage />} />
        <Route path="/pharmacies/:id" element={<PharmacyDetailPage />} />
        <Route path="/soins" element={<SoinsPage />} />
        <Route path="/missions" element={<MissionsPage />} />
        <Route path="/fidelite" element={<FidelitePage />} />
        <Route path="/ma-sante" element={<MaSantePage />} />
        <Route path="/conseil" element={<ConseilPage />} />
        <Route path="/rendez-vous" element={<RendezVousPage />} />
        <Route path="/entretiens" element={<EntretiensPage />} />
        <Route path="/entretiens/nouveau/:templateCode" element={<EntretienFormPage />} />
        <Route path="/entretiens/:id" element={<EntretienFormPage />} />
        <Route path="/prevention" element={<PreventionPage />} />
        <Route path="/calendrier" element={<CalendrierPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/profil" element={<ProfilPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
