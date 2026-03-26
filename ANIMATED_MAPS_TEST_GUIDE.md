# 🎬 Guide de Test - Maps Animées (GIF, MP4, etc.)

## ✅ Fonctionnalités Implémentées

### Backend

- ✅ Type `MediaType` : `"image" | "gif" | "video" | "video-url"`
- ✅ Validation des extensions par type de média
- ✅ Auto-détection du type de média à partir de l'extension
- ✅ Mutation GraphQL `mapImageRequestUpload` accepte `mediaType` optionnel
- ✅ Champ `Map.mediaType` dans la réponse GraphQL
- ✅ Tests unitaires (11/11 passing)

### Frontend

- ✅ Import de `MediaType` dans map-view.tsx
- ✅ Ajout de `mediaType` au fragment GraphQL `mapView_MapFragment`
- ✅ Support pour les différents types de médias dans le rendu
- ✅ Composant `VideoTextureElement` pour vidéos (avec HTMLVideoElement + THREE.VideoTexture)
- ✅ UI Modal: sélecteur de type média avec auto-détection
- ✅ Mutations GraphQL mises à jour avec `mediaType`

## 📋 Étapes de Test

### 1. Tester l'Upload d'une Image Statique

1. Acccéder à http://127.0.0.1:3000/dm
2. Cliquer sur "Create Map" ou le bouton upload
3. Sélectionner une image PNG/JPG/WebP
4. Vérifier que "Media Type" est auto-détecté à "Image"
5. Cliquer "Create Map"
6. Vérifier que la map s'affiche correctement

### 2. Tester l'Upload d'une GIF Animée

1. Préparer un fichier GIF
2. Cliquer sur "Create Map" ou upload
3. Sélectionner le fichier GIF
4. Vérifier que "Media Type" est auto-détecté à "Animated GIF"
5. Cliquer "Create Map"
6. **Vérifier que l'animation GIF fonctionne en temps réel**

### 3. Tester l'Upload d'une Vidéo MP4

1. Préparer un fichier MP4 (test: vidéo courte < 5MB)
2. Cliquer sur "Create Map" ou upload
3. Sélectionner le fichier MP4
4. Vérifier que "Media Type" est auto-détecté à "Video"
5. Cliquer "Create Map"
6. **Vérifier que la vidéo s'affiche** (elle devrait boucler automatiquement et être muette)

### 4. Tester le Changement Manual du Type Média

1. Uploader une image
2. Avant de cliquer "Create Map", changer le "Media Type" manuel
3. Vérifier que le type change correctement

## 🔍 Vérifications Techniques

### GraphQL Schema

```bash
# Vérifier que le schéma inclut mediaType
cat type-definitions.graphql | grep -A 10 "input MapImageRequestUploadInput"
# Doit montrer: mediaType: MediaType
```

### Tests Backend

```bash
# Lancer les tests
npm test -- server/media-types.spec.ts
# Doit afficher: 11/11 tests passed
```

### Compilation

```bash
# Vérifier que tout compile
npm run build
# Doit réussir sans erreurs
```

## 🎥 Résultat Attendu

### Pour les images statiques (PNG, JPG, WebP)

- La map s'affiche comme avant
- `mediaType: "image"`

### Pour les GIFs

- La map s'affiche AVEC animation (GIF anime en temps réel)
- `mediaType: "gif"`
- L'animation boucle automatiquement

### Pour les vidéos (MP4, WebM, OGG)

- La vidéo s'affiche à l'écran
- Elle boucle automatiquement
- Elle est muette (autoplay + muted)
- `mediaType: "video"`

## 🐛 Dépannage

### "Unknown field 'mediaType' on type 'Map'"

→ Exécuter: `npm run write-schema && npm run relay-compiler`

### La vidéo n'apparaît pas

→ Vérifier que le navigateur supporte le format vidéo
→ Vérifier les logs de la console (F12 → Console)

### L'extension n'est pas reconnue automatiquement

→ Vérifier que l'extension est dans `media-types.ts`
→ Format: `.gif`, `.mp4`, `.webm` (minuscule)

## 📁 Fichiers Clés

- `server/media-types.ts` - Types et validation
- `server/maps.ts` - Intégration avec MapEntity
- `server/map-lib.ts` - Logique d'upload
- `server/graphql/modules/map.ts` - API GraphQL
- `src/map-view.tsx` - Rendu des médias
- `src/dm-area/import-file-modal.tsx` - UI upload

## ✨ Prochaines Étapes Possibles

1. Support des URLs vidéo YouTube/Vimeo (avec iframe)
2. Préview vidéo avant upload
3. Limites de taille de fichier
4. Compression automatique des vidéos
5. Support de sous-titres
