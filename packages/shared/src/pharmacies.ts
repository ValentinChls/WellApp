import type { OpeningHours, PharmacySeed, ServiceCode } from './pharmacy'

// Modèles d'horaires réutilisables.
const STD: OpeningHours = {
  mon: [{ open: '08:30', close: '19:30' }],
  tue: [{ open: '08:30', close: '19:30' }],
  wed: [{ open: '08:30', close: '19:30' }],
  thu: [{ open: '08:30', close: '19:30' }],
  fri: [{ open: '08:30', close: '19:30' }],
  sat: [{ open: '09:00', close: '19:00' }],
}
const LUNCH: OpeningHours = {
  mon: [
    { open: '08:30', close: '12:30' },
    { open: '14:00', close: '19:30' },
  ],
  tue: [
    { open: '08:30', close: '12:30' },
    { open: '14:00', close: '19:30' },
  ],
  wed: [
    { open: '08:30', close: '12:30' },
    { open: '14:00', close: '19:30' },
  ],
  thu: [
    { open: '08:30', close: '12:30' },
    { open: '14:00', close: '19:30' },
  ],
  fri: [
    { open: '08:30', close: '12:30' },
    { open: '14:00', close: '19:30' },
  ],
  sat: [{ open: '09:00', close: '12:30' }],
}
const GARDE: OpeningHours = { ...STD, sun: [{ open: '09:00', close: '12:30' }] }

/**
 * Centroïdes départementaux (approx.) pour positionner les marqueurs sur la
 * carte. NOTE : positions approchées au département — à remplacer par un
 * géocodage exact des adresses (CP) avant production.
 */
const DEPT: Record<string, [number, number]> = {
  '01': [46.1, 5.3],
  '02': [49.6, 3.5],
  '03': [46.4, 3.2],
  '08': [49.7, 4.7],
  '09': [42.9, 1.5],
  '11': [43.1, 2.4],
  '13': [43.5, 5.1],
  '29': [48.3, -4.1],
  '31': [43.4, 1.3],
  '33': [44.8, -0.6],
  '36': [46.8, 1.6],
  '37': [47.3, 0.7],
  '38': [45.3, 5.6],
  '40': [43.9, -0.8],
  '41': [47.6, 1.3],
  '42': [45.7, 4.2],
  '43': [45.1, 3.8],
  '44': [47.3, -1.6],
  '45': [47.9, 2.3],
  '50': [49.1, -1.3],
  '51': [48.9, 4.2],
  '52': [48.1, 5.2],
  '54': [48.8, 6.1],
  '57': [49.0, 6.6],
  '58': [47.1, 3.5],
  '59': [50.5, 3.2],
  '61': [48.6, 0.1],
  '62': [50.5, 2.3],
  '64': [43.3, -0.8],
  '65': [43.1, 0.2],
  '69': [45.8, 4.6],
  '72': [47.9, 0.2],
  '74': [46.0, 6.4],
  '76': [49.7, 1.0],
  '77': [48.6, 3.0],
  '82': [44.0, 1.3],
  '83': [43.4, 6.2],
  '84': [44.0, 5.1],
  '85': [46.7, -1.4],
  '88': [48.2, 6.4],
  '92': [48.85, 2.25],
  '94': [48.8, 2.45],
}

// [nom, adresse, CP, département, ville] — source : export du réseau Wellpharma.
const RAW: Array<[string, string, string, string, string]> = [
  ['PHARMACIE DE RIBEMONT', '2 RUE CONDORCET', '02240', '02', 'RIBEMONT'],
  ['PHARMACIE DES GRANDS COUVERTS', '32 COURS DU JEU DU MAIL', '09500', '09', 'MIREPOIX'],
  ['PHARMACIE DE PENHARS', '2BIS ALLEE DES FAUVETTES', '29000', '29', 'QUIMPER'],
  ['PHARMACIE MODERNE', '27 AVENUE DE LA REPUBLIQUE', '37700', '37', 'ST PIERRE DES CORPS'],
  ['PHARMACIE DES ALLEES MARINES', '20 ALLEES MARINES', '40130', '40', 'CAPBRETON'],
  ['PHARMACIE COISSARD', "157 RUE DE L'ORANGER", '42640', '42', 'ST GERMAIN LESPINASSE'],
  ['PHARMACIE CHEVALLIER', '8 ROUTE DE PITHIVIERS', '45480', '45', 'BAZOCHES LES GALLERANDES'],
  ['PHARMACIE GIGLEUX', '76 RUE DE FRANCHEPRE', '54240', '54', 'JOEUF'],
  ['SELARL PHARMACIE DE LA CROIX', '54 R DU FAUBOURG DES 3 MAISONS', '54000', '54', 'NANCY'],
  ['PHARMACIE DU VAL D ELANGE', "52 ROUTE D'ELANGE", '57100', '57', 'THIONVILLE'],
  ['PHARMACIE PATTON', '57 RUE DU GENERAL PATTON', '57330', '57', 'HETTANGE GRANDE'],
  ['PHARMACIE DU LAVOIR', "2 RUE DE L'EGLISE", '57700', '57', 'HAYANGE'],
  ['PHARMACIE DE L AIGLE', "26 PLACE D'ARMES", '57370', '57', 'PHALSBOURG'],
  ['PHARMACIE DU CARREAU', '46 RUE EUGENE KLOSTER', '57800', '57', 'FREYMING MERLEBACH'],
  ['PHARMACIE DU PROGRES', '5 RUE DE LA GARE', '57302', '57', 'HAGONDANGE'],
  ['PHARMACIE DU SOLEIL', '47 RUE DE PARIS', '57100', '57', 'THIONVILLE'],
  ['PHARMACIE DES HAUTS DE VALLIERES', '2 RUE DES MARRONNIERS', '57070', '57', 'METZ'],
  ['PHARMACIE CARNOT NEVERS', '2 PLACE CARNOT', '58000', '58', 'NEVERS'],
  ['PHARMACIE JULES FERRY', '635 RUE JULES FERRY', '59119', '59', 'WAZIERS'],
  ["PHARMACIE SOLEIL", "1 PLACE DE L'ANCIENNE MAIRIE", '69800', '69', 'ST PRIEST'],
  ['PHARMACIE PERRUCHOT', '10 RUE EDMOND HUBERT', '77620', '77', 'EGREVILLE'],
  ['PHARMACIE VIVET', '528 AVENUE FELIX RIPERT', '84100', '84', 'ORANGE'],
  ['PHARMACIE DU MORTIER', '40 RUE DE LA REPUBLIQUE', '01200', '01', 'BELLEGARDE SUR VALSERINE'],
  ['PHARMACIE DE LA POSTE', '1 RUE DE LA LAICITE', '03000', '03', 'AVERMES'],
  ['PHARMACIE DE LA GARE', '4 AVENUE FOREST', '08000', '08', 'CHARLEVILLE MEZIERES'],
  ['PHARMACIE GAMBETTA', '33 RUE GAMBETTA', '08200', '08', 'SEDAN'],
  ['PHARMACIE BESSET', '9 AVENUE FRANCOIS CLAMENS', '11300', '11', 'LIMOUX'],
  ['PHARMACIE DU CENTRE', '235 BOULEVARD MONUMENT AUX MORTS', '11210', '11', 'PORT LA NOUVELLE'],
  ['PHARMACIE RICHAUD', '224 RUE BRETEUIL', '13006', '13', 'MARSEILLE'],
  ['PHARMACIE DE LA CROIX BLANCHE', '1 RUE JEAN MONNET', '31600', '31', 'EAUNES'],
  ['PHARMACIE DE LA COTE D ARGENT', '8 AVENUE SACCHETTI', '33510', '33', 'ANDERNOS'],
  ['SELARL PHARMACIE ATLANTIS BOUSCAT', '46 AVENUE DE LA LIBERATION', '33110', '33', 'LE BOUSCAT'],
  ['PHARMACIE DE LA PLACE', 'PLACE DE LA REPUBLIQUE', '36200', '36', 'ARGENTON SUR CREUSE'],
  ['PHARMACIE GOBERT VERNEDAL', '184 AVENUE JOHN KENNEDY', '36000', '36', 'CHATEAUROUX'],
  ['PHARMACIE DU VOUVRILLON', '8 AVENUE LEON BRULE', '37210', '37', 'VOUVRAY'],
  ['SELAS PHARMACIE CHEVALIER', '27 PLACE CLODOMIR', '38510', '38', 'VEZERONCE CURTIN'],
  ['PHARMACIE CENTRALE', '64 RUE GAMBETTA', '40120', '40', 'ROQUEFORT'],
  ["PHARMACIE L'HERMITAGE", "CENTRE COMMERCIAL L'HERMITAGE", '41260', '41', 'LA CHAUSSEE ST VICTOR'],
  ['PHARMACIE CENTRALE', '16 PLACE DE LA PAIX', '41130', '41', 'SELLES SUR CHER'],
  ['PHARMACIE PERRAZI', '2 AVENUE CHARLES MASSOT', '43750', '43', 'VALS PRES LE PUY'],
  ['PHARMACIE PONT ROUSSEAU', '38 RUE FELIX FAURE', '44400', '44', 'REZE'],
  ['PHARMACIE HILY', '1 RUE BEAU SOLEIL', '44850', '44', 'ST MARS DU DESERT'],
  ['PHARMACIE HEULINOISE', '4 BIS RUE ANDRE RIPOCHE', '44330', '44', 'LA CHAPELLE HEULIN'],
  ['PHARMACIE DES LONGUES ALLEES', '76BIS AVENUE LOUIS JOSEPH SOULAS', '45800', '45', 'ST JEAN DE BRAYE'],
  ["SELARL PHARMACIE DE L'ARNES", '2 PLACE DU 8 MAI 1945', '51490', '51', 'BETHENIVILLE'],
  ['PHARMACIE DE LA PAIX', '34 BIS BOULEVARD DE LA PAIX', '51100', '51', 'REIMS'],
  ["PHARMACIE DE L'EUROPE", '3 AVENUE DE LA REPUBLIQUE', '52000', '52', 'CHAUMONT'],
  ['PHARMACIE LELOUP', '76 AVENUE DU GENERAL DE GAULLE', '54380', '54', 'DIEULOUARD'],
  ['PHARMACIE DENRY', '112 RUE DE LA BERGERIE', '54840', '54', 'GONDREVILLE'],
  ['PHARMACIE DES ARCADES', '4 RUE DES HAUTES ALPES', '54460', '54', 'LIVERDUN'],
  ['PHARMACIE CENTRALE', '21 RUE BANAUDON', '54300', '54', 'LUNEVILLE'],
  ['PHARMACIE D HAUSSONVILLE', "24 BOULEVARD D'HAUSSONVILLE", '54000', '54', 'NANCY'],
  ['PHARMACIE DE LA PLACE RONDE', '15 PLACE DES 3 EVECHES', '54200', '54', 'TOUL'],
  ['PHARMACIE DES COQUELICOTS', '8 BIS RUE JEAN JAURES', '54640', '54', 'TUCQUEGNIEUX'],
  ['PHARMACIE GEHL', '5 RUE DE METZ', '57690', '57', 'CREHANGE'],
  ['SELARL PHARMACIE GHANEM-LOUBET', '90 GRAND RUE', '57190', '57', 'FLORANGE'],
  ['PHARMACIE DES AMMONITES', '2 RUE DU GENERAL PATTON', '57330', '57', 'HETTANGE GRANDE'],
  ['PHARMACIE PIERSON', '19 RUE CROIX SAINT JOSEPH', '57155', '57', 'MARLY'],
  ['PHARMACIE DU TIVOLI', '5 RUE JOSEPH HENOT', '57070', '57', 'METZ'],
  ['PHARMACIE DE LA SOURCE METZERVISSE', '13 GRAND RUE', '57940', '57', 'METZERVISSE'],
  ['SELARL PHARMACIE DE LA CROIX DE LORRAINE', '4 RUE MAURICE THOREZ', '57250', '57', 'MOYEUVRE GRANDE'],
  ['PHARMACIE DU BAZOIS', '46 RUE DU DOCTEUR DUBOIS', '58110', '58', 'CHATILLON EN BAZOIS'],
  ['PHARMACIE DELGUTTE', 'RUE BERNARD PALISSY', '58000', '58', 'NEVERS'],
  ['PHARMACIE MAILLIET', '370 AVENUE DE DUNKERQUE', '59130', '59', 'LAMBERSART'],
  ['PHARMACIE DE MONTSORT', '47 RUE DU MANS', '61000', '61', 'ALENCON'],
  ['PHARMACIE MONESTEL', '2 RUE PABLO PICASSO', '64400', '64', 'OLORON STE MARIE'],
  ['PHARMACIE DE VERDUN', '12 PLACE DE VERDUN', '65000', '65', 'TARBES'],
  ['PHARMACIE BRIATTA - DUBY', '13 AVENUE PIERRE TERRASSE', '69300', '69', 'CALUIRE ET CUIRE'],
  ["PHARMACIE DE L'AVENUE NATIONALE", '136 AVENUE NATIONALE', '72230', '72', 'ARNAGE'],
  ['PHARMACIE CARNOT', '195 BOULEVARD CARNOT', '72000', '72', 'LE MANS'],
  ['PHARMACIE DU MAINE', '48 ROUTE DU MANS', '72300', '72', 'SABLE SUR SARTHE'],
  ['PHARMACIE DU SALEVE', "495 ROUTE D'ANNECY", '74350', '74', 'CRUSEILLES'],
  ['PHARMACIE LEONARD', '27 RUE MARECHAL JOFFRE', '76600', '76', 'LE HAVRE'],
  ['PHARMACIE PRINCIPALE COULOMMIERS', '4 BOULEVARD DE LA MARNE', '77120', '77', 'COULOMMIERS'],
  ['PHARMACIE LAFEUILLADE', '9 BOULEVARD DE LA REPUBLIQUE', '82700', '82', 'MONTECH'],
  ['PHARMACIE DE LA BASILIQUE', '2 RUE GUTENBERG', '83470', '83', 'ST MAXIMIN LA STE BAUME'],
  ['PHARMACIE COUTIERE LAMBROU POLVERELLI', 'ROUTE DE MUY', '83120', '83', 'SAINTE MAXIME'],
  ["PHARMACIE GUIOT", "14 RUE DE L'OISELIERE", '85500', '85', 'LES HERBIERS'],
  ['PHARMACIE DES JARDINS', '13 RUE DES JARDINS', '85600', '85', 'ST HILAIRE DE LOULAY'],
  ['PHARMACIE SABRINA STOUVENIN', '1 B RUE DES TROIS FRERES LARBALETIER', '88130', '88', 'CHARMES'], // CP corrigé : 88132 du CSV = code INSEE de Deyvillers
  ['PHARMACIE DE LA MALADIERE', '87 AVENUE DU GENERAL DE GAULLE', '88300', '88', 'NEUFCHATEAU'],
  ['PHARMACIE SUIRE LECOMTE', '2BIS RUE PASTEUR', '88110', '88', 'RAON L ETAPE'],
  ['PHARMACIE VICHEREY', '1 RUE DE LA HOUBLONNIERE', '88170', '88', 'VICHEREY'],
  ["PHARMACIE IENA", "147 ROUTE DE L'EMPEREUR", '92500', '92', 'RUEIL MALMAISON'],
  ['PHARMACIE DES MARTINETS SELARL', '28 RUE DES FRERES LUMIERE', '92500', '92', 'RUEIL MALMAISON'],
  ['PHARMACIE DU CHATEAU', '100 AVENUE DU GAL DE GAULLE', '94490', '94', 'ORMESSON'],
  ['PHARMACIE DE LA REPUBLIQUE', '38 RUE DE LA REPUBLIQUE', '42000', '42', 'ST ETIENNE'],
  ['PHARMACIE DES LAURIERS', '14 RUE SIMONE DE BEAUVOIR', '44100', '44', 'NANTES'],
  ['PHARMACIE DE LA CLARENCE', '231 RUE JEAN JAURES', '62122', '62', 'LAPUGNOY'],
  ["PHARMACIE DE SAINT MARTIN D'ABBAT", '2 PLACE DU VIEUX PUITS', '45110', '45', 'ST MARTIN D ABBAT'],
  ['PHARMACIE DES TILLEULS', '34 RUE SAINT MARTIN', '50180', '50', 'HEBECREVON'],
  ['PHARMACIE DE BRAS', 'ROUTE DE BRIGNOLES', '83149', '83', 'BRAS'],
]

/**
 * Coordonnées RÉELLES géocodées (API Adresse data.gouv.fr), indexées sur RAW.
 * 91/92 au numéro ou à la rue dans la bonne commune (codes INSEE vérifiés) ;
 * #19 (St-Priest) ≈ place de l'ancienne mairie. Vérifié par recherche web
 * (fusions de communes : Valserhône, Montaigu-Vendée, Thèreval ; ligature Jœuf).
 * Régénérer : `node packages/shared/scripts/geocode.mjs`. `null` ⇒ repli centroïde.
 */
const GEO: Record<number, [number, number] | null> = {
  0: [49.797234, 3.461157], // 02240 Ribemont
  1: [43.08801, 1.878035], // 09500 Mirepoix
  2: [47.989615, -4.132444], // 29000 Quimper
  3: [47.389664, 0.717673], // 37700 Saint-Pierre-des-Corps
  4: [43.640364, -1.432147], // 40130 Capbreton
  5: [46.104854, 3.962787], // 42640 Saint-Germain-Lespinasse
  6: [48.161163, 2.04601], // 45480 Bazoches-les-Gallerandes
  7: [49.22671, 6.0162], // 54240 Jœuf
  8: [48.702585, 6.175673], // 54000 Nancy
  9: [49.369019, 6.111249], // 57100 Thionville
  10: [49.401281, 6.159416], // 57330 Hettange-Grande
  11: [49.335434, 6.080061], // 57700 Hayange
  12: [48.767157, 7.259506], // 57370 Phalsbourg
  13: [49.148274, 6.815697], // 57800 Freyming-Merlebach
  14: [49.25056, 6.168958], // 57302→57300 Hagondange
  15: [49.356582, 6.165018], // 57100 Thionville
  16: [49.135625, 6.213311], // 57070 Metz
  17: [46.988519, 3.157608], // 58000 Nevers
  18: [50.393042, 3.126053], // 59119 Waziers
  19: [45.6963, 4.9439], /* place de l'ancienne mairie (approx. vérifiée) */ // 69800 Saint-Priest
  20: [48.176799, 2.871321], // 77620 Égreville
  21: [44.131773, 4.80035], // 84100 Orange
  22: [46.107309, 5.825534], // 01200 Valserhône (ex-Bellegarde-sur-Valserine)
  23: [46.587387, 3.309264], // 03000 Avermes
  24: [49.769705, 4.724383], // 08000 Charleville-Mézières
  25: [49.701766, 4.944696], // 08200 Sedan
  26: [43.066305, 2.216845], // 11300 Limoux
  27: [43.01967, 3.046183], // 11210 Port-la-Nouvelle
  28: [43.280351, 5.378021], // 13006 Marseille
  29: [43.425722, 1.358905], // 31600 Eaunes
  30: [44.746707, -1.089314], // 33510 Andernos-les-Bains
  31: [44.85503, -0.59541], // 33110 Le Bouscat
  32: [46.588619, 1.519236], // 36200 Argenton-sur-Creuse
  33: [46.794644, 1.691599], // 36000 Châteauroux
  34: [47.41163, 0.797798], // 37210 Vouvray
  35: [45.650704, 5.470979], // 38510 Vézeronce-Curtin
  36: [44.034489, -0.323037], // 40120 Roquefort
  37: [47.604149, 1.355051], // 41260 La Chaussée-Saint-Victor
  38: [47.275489, 1.553536], // 41130 Selles-sur-Cher
  39: [45.029231, 3.878796], // 43750 Vals-près-le-Puy
  40: [47.190422, -1.547247], // 44400 Rezé
  41: [47.360882, -1.40839], // 44850 Saint-Mars-du-Désert
  42: [47.177304, -1.340567], // 44330 La Chapelle-Heulin
  43: [47.907825, 1.967337], // 45800 Saint-Jean-de-Braye
  44: [49.293396, 4.368093], // 51490 Bétheniville
  45: [49.252344, 4.041273], // 51100 Reims
  46: [48.104795, 5.142862], // 52000 Chaumont
  47: [48.840367, 6.070166], // 54380 Dieulouard
  48: [48.690755, 5.974502], // 54840 Gondreville
  49: [48.767314, 6.05785], // 54460 Liverdun
  50: [48.591776, 6.493919], // 54300 Lunéville
  51: [48.672739, 6.16483], // 54000 Nancy
  52: [48.67347, 5.890512], // 54200 Toul
  53: [49.308654, 5.89341], // 54640 Tucquegnieux
  54: [49.062033, 6.579782], // 57690 Créhange
  55: [49.328841, 6.127155], // 57190 Florange
  56: [49.405918, 6.155612], // 57330 Hettange-Grande
  57: [49.058913, 6.159045], // 57155 Marly
  58: [49.101611, 6.196309], // 57070 Metz
  59: [49.314333, 6.282091], // 57940 Metzervisse
  60: [49.251322, 6.046176], // 57250 Moyeuvre-Grande
  61: [47.051799, 3.654796], // 58110 Châtillon-en-Bazois
  62: [46.98586, 3.172682], // 58000 Nevers
  63: [50.639982, 3.019393], // 59130 Lambersart
  64: [48.424804, 0.089668], // 61000 Alençon
  65: [43.187146, -0.624585], // 64400 Oloron-Sainte-Marie
  66: [43.232978, 0.074372], // 65000 Tarbes
  67: [45.798264, 4.850724], // 69300 Caluire-et-Cuire
  68: [47.927768, 0.184879], // 72230 Arnage
  69: [48.005221, 0.17947], // 72000 Le Mans
  70: [47.838855, -0.311475], // 72300 Sablé-sur-Sarthe
  71: [46.028438, 6.105887], // 74350 Cruseilles
  72: [49.499043, 0.1199], // 76600 Le Havre
  73: [48.803086, 3.087857], // 77120 Coulommiers
  74: [43.956369, 1.230407], // 82700 Montech
  75: [43.453741, 5.859525], // 83470 Saint-Maximin-la-Sainte-Baume
  76: [43.34608, 6.606051], // 83120 Sainte-Maxime
  77: [46.879274, -1.012319], // 85500 Les Herbiers
  78: [47.00331, -1.332516], // 85600 Montaigu-Vendée (ex-St-Hilaire-de-Loulay)
  79: [48.370121, 6.291145], // 88130 Charmes
  80: [48.349957, 5.69297], // 88300 Neufchâteau
  81: [48.404683, 6.840136], // 88110 Raon-l'Étape
  82: [48.381951, 5.933891], // 88170 Vicherey
  83: [48.864232, 2.180565], // 92500 Rueil-Malmaison
  84: [48.883707, 2.17165], // 92500 Rueil-Malmaison
  85: [48.790362, 2.534639], // 94490 Ormesson-sur-Marne
  86: [45.439248, 4.393975], // 42000 Saint-Étienne
  87: [47.204985, -1.605733], // 44100 Nantes
  88: [50.515736, 2.539205], // 62122 Lapugnoy
  89: [47.856897, 2.26699], // 45110 Saint-Martin-d'Abbat
  90: [49.128247, -1.168252], // 50180 Thèreval (ex-Hébécrevon)
  91: [43.456889, 5.968591], // 83149 Bras
}

const SMALL = new Set(['de', 'des', 'du', 'la', 'le', 'les', 'et', 'en', 'sur', 'aux', 'au'])
/** Casse de titre française (minuscule sur les mots de liaison sauf en tête). */
function tc(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}
function prng(i: number): number {
  return ((i * 9301 + 49297) % 233280) / 233280
}
const IDF = new Set(['75', '77', '78', '91', '92', '93', '94', '95'])
const NW = new Set(['14', '22', '27', '28', '29', '35', '36', '37', '41', '44', '45', '49', '50', '53', '56', '61', '72', '76', '85'])
const NE = new Set(['02', '03', '08', '10', '21', '25', '51', '52', '54', '55', '57', '58', '59', '62', '67', '68', '70', '88', '90'])
const SE = new Set(['01', '04', '05', '06', '07', '11', '13', '26', '30', '34', '38', '42', '43', '69', '73', '74', '83', '84'])
function regionPrefix(d: string): string {
  if (IDF.has(d)) return '01'
  if (NW.has(d)) return '02'
  if (NE.has(d)) return '03'
  if (SE.has(d)) return '04'
  return '05'
}
function pad2(x: number): string {
  return String(Math.abs(x) % 100).padStart(2, '0')
}
const SERVICE_COMBOS: ServiceCode[][] = [
  ['VACCINATION', 'TROD', 'ENTRETIEN'],
  ['VACCINATION', 'BILAN_MEDICATION', 'ORTHOPEDIE'],
  ['VACCINATION', 'TROD', 'MATERIEL_MEDICAL'],
  ['VACCINATION', 'ENTRETIEN', 'AROMATHERAPIE'],
  ['VACCINATION', 'TROD', 'GARDE'],
  ['VACCINATION', 'MATERIEL_MEDICAL', 'ORTHOPEDIE', 'ENTRETIEN'],
]
const HOURS = [STD, LUNCH, STD, GARDE]

/** Officines Wellpharma (import réseau). Coordonnées approchées au département. */
export const DEMO_PHARMACIES: PharmacySeed[] = RAW.map(([name, addr, cp, dept, city], i) => {
  const [clat, clng] = DEPT[dept] ?? [46.6, 2.4]
  return {
    cip: `00100${String(i + 1).padStart(2, '0')}`,
    name: tc(name),
    addressLine: tc(addr),
    postalCode: cp,
    city: tc(city),
    latitude: GEO[i]?.[0] ?? Number((clat + (prng(i * 2 + 1) - 0.5) * 0.34).toFixed(4)),
    longitude: GEO[i]?.[1] ?? Number((clng + (prng(i * 2 + 7) - 0.5) * 0.34).toFixed(4)),
    phone: `${regionPrefix(dept)} ${pad2(i * 7 + 11)} ${pad2(i * 13 + 7)} ${pad2(i * 17 + 3)} ${pad2(i * 23 + 5)}`,
    services: SERVICE_COMBOS[i % SERVICE_COMBOS.length]!,
    openingHours: HOURS[i % HOURS.length]!,
  }
})
