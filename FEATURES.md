# Navis — Roadmap & État des Features

> **Audit du 2026-05-05**

---

## 🗂️ Situation des branches

| Branch                          | État                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| `master` / `feature/update-fog` | Météo ✅ · Fog de base · Pas d'effets                           |
| `feature/météo`                 | Météo ✅ · Fog organique ✅ · Effets de zone ✅ · Fixes sécu ✅ |

**Action recommandée** : merger `feature/météo` → `master` pour consolider.

---

## ✅ Implémenté sur `master`

### Système Météo

- **Types** : `none`, `rain`, `storm`, `snow`, `sun`
- **Configurable** : intensité (0–1) + angle du vent (−60° à +60°)
- **Rendus Three.js**
  - Pluie : 1 500 particules avec gravité
  - Orage : 3 000 particules + éclairs aléatoires
  - Neige : 600 particules avec drift horizontal
  - Soleil : overlay jaune pulsant
- **GraphQL** : mutation `mapUpdateWeather`
- **Sync temps réel** : DM → joueurs via live query
- **UI DM** : bouton toolbar + panneau Chakra (slider intensité, angle)

---

## ✅ Implémenté sur `feature/météo` (à merger)

### Brouillard de Guerre Organique

- Shader GLSL avec Fractal Brownian Motion (fbm)
- Distortion UV `edgeWarp * 0.025` pour contours sinueux
- `smoothstep(0.04, 0.38, fogMask)` — transition douce, non uniforme
- Rendu DM : `FogDMRenderer` sans distortion (contours nets)
- Rendu joueurs : `FogAnimatedRenderer` avec distortion (immersion)

### Effets de Zone Persistants

- **Types** : feu, explosion, foudre, eau
- **Stockage** : `effects[]` dans `MapEntity` (GraphQL + schema + SQLite)
- **Rendus Three.js**
  - Feu : 120 particules orange/jaune, drift vertical + flicker
  - Explosion : scorch mark noir + ring pulsant + smoke grise
  - Foudre : bolt aléatoire + glow bleu, flash timer (`useMemo` stable)
  - Eau : 3 ripple rings + base fill bleu
  - `RemoveHandle` rouge (DM only) — suppression au clic
- **Outil DM** (`EffectMarkerMapTool`) : sélecteur type, slider rayon, preview ring
- **GraphQL** : `mapEffectAdd` / `mapEffectRemove`
- **Error boundary** : `EffectErrorBoundary` autour de chaque `SingleEffect`
- **Bug fix** : `MapEffectsRenderer` et `WeatherSystem` placés dans `SharedMapState.Provider`

### Sécurité & Dépendances

- express 4.17 → 4.22.1
- socket.io 4.4 → 4.8.3 (CRITICAL: socket.io-parser fix)
- sanitize-html 2.5 → 2.17.3
- sqlite 4 → 5 + sqlite3 5 → 6.0.1
- Patch engine.io : `import { type X }` → `import type { X }` (compat TS 4.4)
- Vulnérabilités réduites de 47 → 20

---

## 📋 Backlog

### Haute priorité

- [ ] **Merger `feature/météo` → `master`** — consolide 4 features majeures déjà prêtes
- [ ] **Portes / Murs interactifs** — entités placées par le DM, état ouvert/fermé, bloquant la visibilité
- [ ] **Éclairage dynamique** — sources lumineuses avec halo animé Three.js, radius configurable
- [ ] **Docker Compose** — `docker-compose.yml` + `.env.example` pour déploiement one-liner

### Moyenne priorité

- [ ] **Tokens enrichis** — portrait, classe, barre de vie, visibles joueurs si autorisé
- [ ] **Ping / Pointer amélioré** — curseur animé visible de tous + affichage nom du joueur (ping basique existe dans `dm-map.tsx`)
- [ ] **Dialogue bubbles** — bulle de texte au-dessus d'un token, durée configurable
- [ ] **Cadavres** — état `dead` sur un token : token grisé, icône tête de mort, reste sur la carte

### Basse priorité / Nice-to-have

- [ ] **Indicateurs sonores** — icône source sonore placée sur la carte (ambiance)
- [ ] **GitHub Kanban** — issues + project board pour ce backlog
- [ ] **CI pipeline** — restore tests + lint automatique sur PR
- [ ] **Hosting docs** — guide déploiement (Heroku, VPS, Fly.io)

---

## 🔒 Dettes techniques

| Problème                                | Impact                     | Effort                       |
| --------------------------------------- | -------------------------- | ---------------------------- |
| `vite@2` (→ v8 requis)                  | Dev only — prod build safe | Moyen (config + plugins)     |
| `relay-compiler@10` (→ v20)             | Build-time only            | Élevé (API + schema)         |
| Node 16 dans Dockerfile (EOL sept 2023) | Sécurité prod              | Faible (changer FROM)        |
| React 17 (React 18 dispo)               | Perf + Concurrent Mode     | Élevé (breaking changes r3f) |

---

## 📝 Architecture

- **Relay + GraphQL** : live queries via `invalidateResourcesRT()`
- **react-three-fiber v5** : Canvas isolé, `ContextBridge` pour propagation de context
- **Three.js** : `DynamicDrawUsage` + `needsUpdate` pour particle systems
- **GLSL shaders** : fog shader avec `noise2D` + fbm
- **SQLite3 6** + migrations versionnées (`server/migrations/`)
- **DB schema actuel** : `maps`, `notes`, `tokenImages` (4 migrations)

### Commandes

```bash
npm install
npm run setup                 # write-schema + relay-compiler
npm run start:server:dev      # port 3000
npm run start:frontend:dev    # port 4000
```

---

**Last updated** : 2026-05-05
