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
- **🔐 Authentification sécurisée** - Connexion email/mot de passe

## 🛠️ Stack Technique

### Frontend
- **React 19** - Bibliothèque UI moderne
- **TypeScript** - Typage statique pour la sécurité du code
- **TanStack Router** - Routage basé sur les fichiers avec sécurité des types
- **TailwindCSS** - Framework CSS utilitaire-first
- **shadcn/ui** - Composants UI réutilisables et accessibles
- **Zustand** - Gestion d'état légère et performante

### Backend
- **Hono** - Framework serveur léger et performant
- **tRPC** - APIs end-to-end avec sécurité des types
- **Drizzle ORM** - ORM TypeScript-first
- **PostgreSQL** - Base de données relationnelle robuste
- **Redis** - Cache et gestion des sessions
- **Better Auth** - Authentification moderne et sécurisée

### Infrastructure
- **Bun** - Runtime JavaScript ultra-rapide
- **Turborepo** - Monorepo optimisé pour la performance
- **Docker** - Conteneurisation et déploiement

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
│   │   │   ├── components/  # Composants réutilisables
│   │   │   ├── routes/      # Pages et routage
│   │   │   ├── stores/      # Gestion d'état Zustand
│   │   │   └── utils/       # Utilitaires et helpers
│   │   └── public/          # Assets statiques
│   └── server/              # API backend Hono + tRPC
│       ├── src/
│       │   ├── procedures/  # Procédures tRPC
│       │   ├── routers/     # Routeurs API
│       │   ├── db/          # Schémas et configuration DB
│       │   └── lib/         # Utilitaires serveur
│       └── drizzle.config.ts
├── packages/                 # Packages partagés (si applicable)
├── compose.yml              # Configuration Docker
└── turbo.json              # Configuration Turborepo
```

## 🗄️ Base de Données

### Schémas Principaux
- **Users** - Gestion des utilisateurs et authentification
- **Pokes** - Système de poke entre utilisateurs
- **WebPush** - Notifications push
- **Leaderboard** - Classements et statistiques

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
```

## 📜 Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `bun dev` | Démarre tous les services en mode développement |
| `bun build` | Compile tous les projets |
| `bun dev:web` | Démarre uniquement le frontend |
| `bun dev:server` | Démarre uniquement l'API |
| `bun check-types` | Vérifie les types TypeScript |
| `bun db:push` | Applique les changements de schéma |
| `bun db:studio` | Ouvre l'interface de gestion de la DB |

## 🔧 Configuration

### Variables d'Environnement (Server)

```bash
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/pok7"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentification
AUTH_SECRET="your-secret-key"
AUTH_URL="http://localhost:3000"

# Notifications Push
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
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
