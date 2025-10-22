# 🎯 Pok7

Une application moderne de pokes à la Meta avec des fonctionnalités temps réel, construite avec une stack TypeScript de pointe.

## ✨ Fonctionnalités

- **🔔 Notifications Push** - Recevez des notifications en temps réel
- **📡 Server-Sent Events** - Mises à jour instantanées sans rechargement
- **👥 Système de Poke** - Interagissez avec d'autres utilisateurs
- **🏆 Classement** - Suivez votre position dans le classement
- **🔍 Recherche d'utilisateurs** - Trouvez facilement d'autres personnes
- **🌙 Thème sombre/clair** - Interface adaptée à vos préférences
- **📱 PWA** - Installation sur mobile et desktop
- **🔐 Authentification sécurisée** - Authentification centralisée

## 🛠️ Stack Technique

### Frontend
- **React 19** - Bibliothèque UI moderne avec les dernières fonctionnalités
- **TypeScript** - Typage statique pour la sécurité du code
- **TanStack Router** - Routage basé sur les fichiers avec sécurité des types
- **TanStack Query** - Gestion d'état serveur et cache intelligent
- **Vite** - Build tool ultra-rapide avec HMR
- **TailwindCSS 4** - Framework CSS utilitaire-first nouvelle génération
- **Radix UI** - Composants UI accessibles et headless
- **shadcn/ui** - Composants UI réutilisables basés sur Radix
- **Zustand** - Gestion d'état légère et performante
- **React Flip Toolkit** - Animations fluides et transitions
- **PWA** - Application Web Progressive avec Service Workers
- **OAuth2 PKCE** - Authentification sécurisée

### Backend
- **Fastify** - Framework serveur Node.js ultra-rapide
- **Connect RPC** - APIs gRPC-Web avec sécurité des types
- **Protocol Buffers** - Sérialisation binaire efficace
- **Drizzle ORM** - ORM TypeScript-first avec migrations
- **PostgreSQL** - Base de données relationnelle robuste
- **Redis (ioredis)** - Cache et gestion des sessions temps réel
- **Web Push** - Notifications push natives
- **JOSE** - Gestion sécurisée des tokens JWT
- **Winston** - Logging structuré et performant

### Infrastructure & Tools
- **Bun 1.2.17** - Runtime JavaScript ultra-rapide
- **Turborepo** - Monorepo optimisé pour la performance
- **Docker** - Conteneurisation et déploiement
- **Buf** - Outils Protocol Buffers modernes
- **Drizzle Kit** - Outils de migration et introspection DB

## 🚀 Démarrage Rapide

### Prérequis
- [Bun](https://bun.sh/) (version 1.2.17+)
- [Docker](https://docker.com/) (pour PostgreSQL et Redis)

### Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd pok7
```

2. **Installer les dépendances**
```bash
bun install
```

3. **Configuration de l'environnement**
```bash
cd apps/server
cp .env.example .env
# Éditer .env avec vos variables d'environnement
```

4. **Démarrer les services**
```bash
# Démarrer PostgreSQL et Redis
docker-compose up -d

# Ou utiliser les services locaux si configurés
```

5. **Initialiser la base de données**
```bash
bun db:push
```

6. **Lancer l'application**
```bash
# Démarrer le serveur et le frontend
bun dev

# Ou démarrer séparément
bun dev:server  # API sur http://localhost:3000
bun dev:web     # Frontend sur http://localhost:3001
```

## 📁 Structure du Projet

```
pok7/
├── apps/
│   ├── web/                 # Application frontend React
│   │   ├── src/
│   │   │   ├── components/  # Composants réutilisables (UI, sheets, etc.)
│   │   │   ├── routes/      # Pages et routage TanStack Router
│   │   │   ├── stores/      # Gestion d'état Zustand
│   │   │   ├── hooks/       # Hooks personnalisés
│   │   │   ├── lib/         # Utilitaires et helpers
│   │   │   ├── rpc/         # Types Protocol Buffers générés
│   │   │   └── utils/       # Fonctions utilitaires
│   │   ├── public/          # Assets statiques et PWA
│   │   └── dist/            # Build de production
│   └── server/              # API backend Fastify + Connect RPC
│       ├── src/
│       │   ├── rpc/         # Implémentations Connect RPC
│       │   │   ├── implementations/  # Services protobuf
│       │   │   └── proto/    # Types protobuf générés
│       │   ├── db/          # Schémas Drizzle et configuration
│       │   ├── lib/         # Utilitaires serveur (Redis, WebPush, etc.)
│       │   └── index.ts     # Point d'entrée Fastify
│       ├── proto/           # Définitions Protocol Buffers
│       ├── drizzle.config.ts
│       └── Containerfile    # Docker pour production
├── compose.yml              # Configuration Docker (PostgreSQL + Redis)
└── turbo.json              # Configuration Turborepo
```

## 🗄️ Base de Données

### Schémas Principaux
- **Users** - Gestion des utilisateurs et authentification
- **Pokes** - Système de poke entre utilisateurs avec visibilité leaderboard
- **WebPush** - Notifications push et subscriptions
- **Leaderboard** - Classements et statistiques anonymisées

### Commandes Utiles
```bash
# Appliquer les changements de schéma
bun db:push

# Ouvrir l'interface de gestion de la DB
bun db:studio

# Générer des migrations
bun db:generate

# Appliquer les migrations
bun db:migrate

# Démarrer l'infrastructure (PostgreSQL + Redis)
bun dev:server dev-infra
```

## 📜 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `bun dev` | Démarre tous les services en mode développement |
| `bun build` | Compile tous les projets |
| `bun dev:web` | Démarre uniquement le frontend (port 3001) |
| `bun dev:server` | Démarre uniquement l'API (port 8080) |
| `bun check-types` | Vérifie les types TypeScript |
| `bun db:push` | Applique les changements de schéma |
| `bun db:studio` | Ouvre l'interface de gestion de la DB |
| `bun db:generate` | Génère les migrations Drizzle |
| `bun db:migrate` | Applique les migrations |

## 🔧 Configuration

### Variables d'Environnement

#### Server (.env)
```bash
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/pok7"

# Redis pour les sessions et cache
REDIS_URL="redis://localhost:6379"

# Notifications Push Web (VAPID)
VAPID_EMAIL="your-email@example.com"
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"

# Configuration serveur
NODE_ENV="development"
LOG_LEVEL="info"
HOST="0.0.0.0"
PORT="8080"

# CORS - Origines autorisées (séparées par des virgules)
ALLOWED_ORIGINS="http://localhost:3001,https://pokes.myr-project.eu"
```

#### Web (.env)
```bash
# URL du serveur backend
VITE_SERVER_URL="http://localhost:8080"

# Notifications Push Web (VAPID Public Key pour le frontend)
VITE_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

#### Configuration OAuth2 (Hardcodée)
```typescript
// Configuration OAuth2 centralisée dans main.tsx
const authConfig = {
  clientId: "t9xFI53nHMTMRduUB1Kt2fUpV1IcFOfNXUZHjpmZ",
  authorizationEndpoint: "https://myr-project.eu/application/o/authorize/",
  tokenEndpoint: "https://myr-project.eu/application/o/token/",
  redirectUri: window.location.origin,
  scope: "profile openid offline_access picture",
};
```

## 🚀 Déploiement

### Production
```bash
# Build de production
bun build

# Démarrage en production
bun start
```

### Docker
```bash
# Build de l'image
docker build -f apps/server/Containerfile -t pok7-server .

# Exécution
docker run -p 3000:3000 pok7-server
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Si vous rencontrez des problèmes ou avez des questions :
- Ouvrez une [issue](https://github.com/votre-username/pok7/issues)
- Consultez la [documentation](https://github.com/votre-username/pok7/wiki)

---

**Développé avec ❤️ et [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)**
