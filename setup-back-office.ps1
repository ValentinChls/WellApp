# =====================================================================
# Setup back-office Wellpharma (admin) en une commande.
#   1) verifie le .env, 2) install, 3) Prisma generate,
#   4) cree les tables (db push), 5) seed, 6) lance le dev server.
# Usage :  ./setup-back-office.ps1     (ou : pnpm setup:back-office)
# =====================================================================
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Step($label, [scriptblock]$cmd) {
  Write-Host "`n=== $label ===" -ForegroundColor Cyan
  & $cmd
  if ($LASTEXITCODE -ne 0) { Write-Host "X Echec : $label (code $LASTEXITCODE)" -ForegroundColor Red; exit 1 }
}

# 0) .env present + complete ?
if (-not (Test-Path ".env")) {
  Write-Host "X .env introuvable a la racine. Copie .env.example en .env d'abord." -ForegroundColor Red
  exit 1
}
$placeholders = Select-String -Path ".env" -Pattern '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|ENGAGEMENT_DATABASE_URL|HEALTH_DATABASE_URL)=.*(PROJECT_REF|DB_PASSWORD|eyJ\.\.\.)' -Quiet
if ($placeholders) {
  Write-Host "X Le .env contient encore des valeurs a remplacer (cle Supabase / mot de passe DB)." -ForegroundColor Red
  Write-Host "  Complete les 4 valeurs marquees '> COLLER' dans .env, puis relance ce script." -ForegroundColor Yellow
  exit 1
}

Step "1/5 Installation des dependances" { pnpm install }
Step "2/5 Generation des clients Prisma" { pnpm db:generate }
Step "3/5 Creation des tables (engagement + sante)" { pnpm db:push }
Step "4/5 Seed (92 officines + marronnier + 3 comptes)" { pnpm db:seed }

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " Setup termine. Comptes de connexion :" -ForegroundColor Green
Write-Host "   Groupement : valentin.charles@equasens.com / Wellpharma2026!" -ForegroundColor Green
Write-Host "   Pharmacien : admin.pharmacie@wellpharma.test / Wellpharma2026!" -ForegroundColor Green
Write-Host " Demarrage du back-office -> http://localhost:3000/login" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Green

Step "5/5 Lancement du dev server admin" { pnpm dev:admin }
