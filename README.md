# DONA.club — Visualiser

> **A temporal consciousness interface that transforms how humans perceive and navigate their relationship with time.**

[🇫🇷 Version française](#version-française) | [🇬🇧 English version](#english-version)

---

## English Version

### 🌅 The Vision

**Visualiser** is not a calendar—it's a **temporal awareness instrument** that reveals the invisible architecture of your days. By rendering time as a living, breathing circle synchronized with natural rhythms, Visualiser helps you develop an intuitive, embodied relationship with your temporal existence.

This is the first manifestation of **DONA.club's broader ambition**: to master quality of life across projects, organizations, and individuals through temporal intelligence.

**Core Principles:**

- **Circadian Consciousness**: Time visualization adapts to your biological rhythms and natural light cycles
- **Unified Temporal View**: Seamlessly merge multiple time streams (Google, Microsoft, etc.) into one coherent reality
- **Contextual Awareness**: AI companion with complete understanding of your temporal landscape
- **Ambient Intelligence**: Information emerges when relevant, dissolves when not—honoring attention as sacred

---

### ✨ What Visualiser Does

#### 🎯 Circular Time Perception
- **24-hour consciousness wheel** with solar cycle markers (sunrise/sunset)
- **Living background gradients** that breathe with your circadian state
- **Event arcs** revealing temporal density and proximity
- **Sleep architecture overlay** showing rest patterns and recovery debt/surplus
- **Temporal navigation** through intuitive gestures (scroll/swipe through time)

#### 🔗 Multi-Stream Time Integration
- **Google ecosystem** with intelligent token management
- **Microsoft ecosystem** (Office 365) via Graph API
- **Multi-identity support** through secure OAuth orchestration
- **Real-time synchronization** across all connected time streams
- **Conflict-free temporal merging** from heterogeneous sources

#### 😴 Sleep Intelligence (Google Fit)
- **Automatic sleep session detection** from Google Fit
- **Recovery debt calculation** over rolling 7-day windows
- **Optimal rest timing recommendations** based on wake patterns
- **Visual sleep architecture** integrated into the temporal wheel
- **Historical sleep data** accessible for any past moment

#### 🤖 Temporal AI Companion (OpenAI Assistants)
- **Full contextual awareness**: temporal state, sleep, location, theme, connections
- **Natural language temporal queries**: "What's emerging next?", "How's my recovery?"
- **Analytical tools**: Can examine your temporal patterns and surface insights
- **Streaming consciousness** with real-time tool activity
- **Persistent conversation memory** across sessions

#### 🎨 Adaptive Interface
- **System theme synchronization** (dark/light modes)
- **Circadian gradient evolution** throughout the day
- **Golden ratio proportions** for visual harmony
- **Touch-first responsive design** with gestural fluidity
- **Accessibility-centered** with ARIA semantics

---

### 🏗️ Technical Architecture

#### Technology Foundation

**Interface Layer:**
- **React 18** with TypeScript for type-safe component architecture
- **Vite** for instant feedback loops and optimized builds
- **Tailwind CSS** for utility-first styling with custom design tokens
- **shadcn/ui** for accessible, composable UI primitives
- **React Router** for client-side navigation
- **TanStack Query** for server state orchestration

**Intelligence Layer:**
- **Supabase** for authentication, persistence, and serverless functions
- **PostgreSQL** with Row Level Security for data sovereignty
- **Supabase Edge Functions** (Deno runtime) for serverless compute
- **OpenAI Assistants API** for conversational intelligence with tool use
- **ChatKit** for embedded conversational UI with streaming

**Integration Layer:**
- **Google Calendar API** (OAuth 2.0)
- **Microsoft Graph API** (Azure AD OAuth)
- **Google Fit API** for biometric data
- **Sunrise-Sunset API** for solar calculations
- **OpenAI GPT-4** for natural language understanding

**Deployment:**
- **GitHub Actions** for continuous deployment
- **OVH Cloud Web** for production hosting
- **Capacitor** for native iOS/Android compilation
- **Service Workers** for offline resilience

#### Data Architecture

```sql
-- OAuth token vault with automatic refresh
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'microsoft', etc.
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- User preference persistence
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);
```

**Security Model:**
- Row Level Security (RLS) enforced on all tables
- User data isolation at database level
- Service role for administrative operations only

#### Serverless Functions

**`chatkit-session`** — Initializes AI companion with full temporal context
```typescript
POST /functions/v1/chatkit-session
Body: { deviceId, pageContext }
Returns: { client_secret, context_sent }
```

**`google-token-refresh`** — Maintains Google ecosystem connectivity
```typescript
POST /functions/v1/google-token-refresh
Body: { refresh_token }
Returns: { access_token, expires_in }
```

**`microsoft-token-refresh`** — Maintains Microsoft ecosystem connectivity
```typescript
POST /functions/v1/microsoft-token-refresh
Body: { refresh_token, scope }
Returns: { access_token, refresh_token, expires_in }
```

**`chat`** — Streaming conversational intelligence endpoint
```typescript
POST /functions/v1/chat
Body: { messages, stream, thread_id }
Returns: Server-Sent Events stream
```

---

### 🚀 Implementation Guide

#### Prerequisites

- **Node.js 20+** and npm 10+
- **Supabase project** with authentication enabled
- **Google Cloud Console** project with Calendar & Fit APIs
- **Microsoft Azure AD** app registration with Graph API permissions
- **OpenAI API key** with Assistants API access

#### Environment Configuration

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/dona-club.git
cd dona-club
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Supabase connection:**
```bash
# Create .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Configure serverless secrets:**
```bash
# In Supabase Dashboard → Edge Functions → Manage Secrets
OPENAI_API_KEY=sk-...
CHATKIT_WORKFLOW_ID=wf_...
CHATKIT_DOMAIN_KEY=dk_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

5. **Apply database migrations:**
```bash
# Migrations located in supabase/migrations/
# Execute via Supabase Dashboard → SQL Editor
```

6. **Configure OAuth redirect URIs:**
- **Google Console**: Add `https://your-project.supabase.co/auth/v1/callback`
- **Azure Portal**: Add same URL to redirect URIs

#### Development Workflow

```bash
# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

#### Deployment Pipeline

**Automated (GitHub Actions):**
```yaml
# .github/workflows/deploy-ovh.yml
# Triggers on main branch push
# Deploys to OVH Cloud Web via FTP
```

**Manual:**
```bash
npm run build
# Upload dist/ folder to hosting provider
```

---

### 🎨 White-Label Adaptation

Visualiser is architected as a **white-label temporal intelligence platform**:

#### Brand Identity
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: "#your-brand-color",
      accent: "#your-accent-color",
    },
    fontFamily: {
      sans: ["Your Font", "Inter", "sans-serif"],
    },
  },
}
```

#### Platform Configuration
```typescript
// src/config/brand.ts
export const BRAND_CONFIG = {
  name: "Your Brand",
  logo: "/your-logo.svg",
  domain: "yourdomain.com",
  supportEmail: "support@yourdomain.com",
};
```

#### Feature Toggles
```typescript
// src/config/features.ts
export const FEATURES = {
  googleIntegration: true,
  microsoftIntegration: true,
  sleepIntelligence: true,
  aiCompanion: true,
  // Modular feature activation per deployment
};
```

---

### 📊 Temporal Context System

Visualiser generates rich contextual awareness for the AI companion:

```typescript
type TemporalContext = {
  timestamp: string;
  interface: { url, title, pathname };
  viewport: { width, height, orientation };
  theme: { isDarkMode, colorScheme };
  temporal: {
    currentMoment: string;
    virtualMoment: string | null;
    solarCycle: { sunrise, sunset };
    location: { latitude, longitude };
  };
  timeStreams: {
    total: number;
    emerging: Array<{
      title, organizer, start, end, duration,
      proximity, location, hasVideoLink, url
    }>;
    currentEvent: { title, organizer, start, end, remaining } | null;
  };
  recovery: {
    tracking: boolean;
    wakeTime: number | null;
    restTime: number | null;
    totalRecovery: number | null;
    debtOrSurplus: { type, hours, daysCount } | null;
  };
  connections: { google, microsoft, apple, facebook, amazon };
  identity: { deviceId, userAgent, language, timezone };
};
```

**Console Access:**
```javascript
window.getPageContext() // Returns complete temporal context
```

---

### 🔒 Security & Privacy Architecture

#### Authentication Model
- **Supabase Auth** with OAuth 2.0 provider federation
- **JWT tokens** with automatic refresh cycles
- **Encrypted token vault** in Supabase with RLS enforcement
- **Zero client-side secrets** — all sensitive operations in edge functions

#### Data Sovereignty
- **Row Level Security** enforced on all data tables
- **User data isolation** at database query level
- **End-to-end encryption** (HTTPS/WSS only)
- **Privacy-first design** — no third-party analytics or tracking

#### Token Lifecycle Management
- **Proactive token refresh** before expiration
- **Graceful degradation** on token invalidation
- **Clear reconnection prompts** for expired sessions
- **Secure token revocation** on disconnect

---

### 🧪 Quality Assurance

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Build verification
npm run build
```

**Manual Verification Checklist:**
- [ ] Google time stream synchronization with multiple events
- [ ] Microsoft time stream synchronization with recurring patterns
- [ ] Sleep intelligence data from Google Fit
- [ ] AI companion with full temporal context
- [ ] Theme adaptation (dark/light)
- [ ] Touch gesture navigation
- [ ] Token refresh on expiration
- [ ] Multi-day temporal navigation

---

### 📈 Performance Characteristics

**Optimization Strategy:**
- **Code splitting** with dynamic imports
- **Lazy loading** for routes and heavy components
- **Memoization** of expensive computations (solar calculations, event filtering)
- **Debounced API calls** to respect rate limits
- **Optimistic UI updates** for perceived performance
- **Service worker caching** for offline resilience

**Bundle Metrics:**
- Main bundle: ~180KB (gzipped)
- Vendor chunks: ~220KB (gzipped)
- Initial load: ~400KB total

---

### 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/temporal-enhancement`
3. **Commit your changes**: `git commit -m 'Add temporal enhancement'`
4. **Push to branch**: `git push origin feature/temporal-enhancement`
5. **Open a Pull Request**

**Code Standards:**
- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling
- Semantic naming conventions
- Inline documentation for complex logic

---

### 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

---

### 🙏 Acknowledgments

- **OpenAI** for GPT-4 and Assistants API
- **Supabase** for backend infrastructure
- **Vercel** for shadcn/ui components
- **Radix UI** for accessible primitives
- **Lucide** for iconography

---

### 📞 Support

- **Documentation**: [docs.dona.club](https://docs.dona.club)
- **Issues**: [GitHub Issues](https://github.com/yourusername/dona-club/issues)
- **Email**: support@dona.club
- **Discord**: [Join our community](https://discord.gg/dona-club)

---

## Version Française

### 🌅 La Vision

**Visualiser** n'est pas un calendrier—c'est un **instrument de conscience temporelle** qui révèle l'architecture invisible de vos journées. En représentant le temps comme un cercle vivant, synchronisé avec les rythmes naturels, Visualiser vous aide à développer une relation intuitive et incarnée avec votre existence temporelle.

C'est la première manifestation de **l'ambition plus large de DONA.club** : maîtriser la qualité de vie des projets, organisations et individus à travers l'intelligence temporelle.

**Principes Fondamentaux :**

- **Conscience Circadienne** : La visualisation du temps s'adapte à vos rythmes biologiques et cycles de lumière naturelle
- **Vue Temporelle Unifiée** : Fusion transparente de multiples flux temporels (Google, Microsoft, etc.) en une réalité cohérente
- **Conscience Contextuelle** : Compagnon IA avec compréhension complète de votre paysage temporel
- **Intelligence Ambiante** : L'information émerge quand pertinente, se dissout sinon—honorant l'attention comme sacrée

---

### ✨ Ce que Fait Visualiser

#### 🎯 Perception Circulaire du Temps
- **Roue de conscience 24 heures** avec marqueurs de cycle solaire (lever/coucher)
- **Dégradés d'arrière-plan vivants** qui respirent avec votre état circadien
- **Arcs d'événements** révélant densité et proximité temporelles
- **Superposition d'architecture du sommeil** montrant patterns de repos et dette/surplus de récupération
- **Navigation temporelle** par gestes intuitifs (défilement/balayage dans le temps)

#### 🔗 Intégration Multi-Flux Temporels
- **Écosystème Google** avec gestion intelligente des tokens
- **Écosystème Microsoft** (Office 365) via Graph API
- **Support multi-identités** par orchestration OAuth sécurisée
- **Synchronisation temps réel** sur tous les flux temporels connectés
- **Fusion temporelle sans conflit** depuis sources hétérogènes

#### 😴 Intelligence du Sommeil (Google Fit)
- **Détection automatique des sessions de sommeil** depuis Google Fit
- **Calcul de dette de récupération** sur fenêtres glissantes de 7 jours
- **Recommandations de timing optimal de repos** basées sur patterns de réveil
- **Architecture visuelle du sommeil** intégrée dans la roue temporelle
- **Données historiques de sommeil** accessibles pour tout moment passé

#### 🤖 Compagnon IA Temporel (OpenAI Assistants)
- **Conscience contextuelle complète** : état temporel, sommeil, localisation, thème, connexions
- **Requêtes temporelles en langage naturel** : "Qu'est-ce qui émerge ensuite ?", "Comment va ma récupération ?"
- **Outils analytiques** : Peut examiner vos patterns temporels et révéler des insights
- **Conscience en streaming** avec activité des outils en temps réel
- **Mémoire conversationnelle persistante** entre sessions

#### 🎨 Interface Adaptive
- **Synchronisation thème système** (modes sombre/clair)
- **Évolution de dégradé circadien** tout au long de la journée
- **Proportions nombre d'or** pour harmonie visuelle
- **Design responsive tactile-first** avec fluidité gestuelle
- **Centré accessibilité** avec sémantique ARIA

---

### 🏗️ Architecture Technique

#### Fondation Technologique

**Couche Interface :**
- **React 18** avec TypeScript pour architecture de composants type-safe
- **Vite** pour boucles de feedback instantanées et builds optimisés
- **Tailwind CSS** pour styling utility-first avec tokens de design personnalisés
- **shadcn/ui** pour primitives UI accessibles et composables
- **React Router** pour navigation côté client
- **TanStack Query** pour orchestration d'état serveur

**Couche Intelligence :**
- **Supabase** pour authentification, persistance et fonctions serverless
- **PostgreSQL** avec Row Level Security pour souveraineté des données
- **Supabase Edge Functions** (runtime Deno) pour compute serverless
- **OpenAI Assistants API** pour intelligence conversationnelle avec usage d'outils
- **ChatKit** pour UI conversationnelle embarquée avec streaming

**Couche Intégration :**
- **Google Calendar API** (OAuth 2.0)
- **Microsoft Graph API** (Azure AD OAuth)
- **Google Fit API** pour données biométriques
- **Sunrise-Sunset API** pour calculs solaires
- **OpenAI GPT-4** pour compréhension du langage naturel

**Déploiement :**
- **GitHub Actions** pour déploiement continu
- **OVH Cloud Web** pour hébergement production
- **Capacitor** pour compilation native iOS/Android
- **Service Workers** pour résilience offline

---

### 🚀 Guide d'Implémentation

#### Prérequis

- **Node.js 20+** et npm 10+
- **Projet Supabase** avec authentification activée
- **Projet Google Cloud Console** avec APIs Calendar & Fit
- **Enregistrement app Microsoft Azure AD** avec permissions Graph API
- **Clé API OpenAI** avec accès Assistants API

#### Configuration Environnement

1. **Cloner le dépôt :**
```bash
git clone https://github.com/votreusername/dona-club.git
cd dona-club
```

2. **Installer les dépendances :**
```bash
npm install
```

3. **Configurer connexion Supabase :**
```bash
# Créer .env.local
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

4. **Configurer secrets serverless :**
```bash
# Dans Dashboard Supabase → Edge Functions → Manage Secrets
OPENAI_API_KEY=sk-...
CHATKIT_WORKFLOW_ID=wf_...
CHATKIT_DOMAIN_KEY=dk_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

5. **Appliquer migrations base de données :**
```bash
# Migrations dans supabase/migrations/
# Exécuter via Dashboard Supabase → SQL Editor
```

6. **Configurer URIs de redirection OAuth :**
- **Console Google** : Ajouter `https://votre-projet.supabase.co/auth/v1/callback`
- **Portail Azure** : Ajouter même URL aux URIs de redirection

#### Workflow Développement

```bash
# Démarrer serveur développement
npm run dev

# Build production
npm run build

# Prévisualiser build production
npm run preview
```

---

### 🎨 Adaptation Marque Blanche

Visualiser est architecturé comme **plateforme d'intelligence temporelle marque blanche** :

#### Identité de Marque
```typescript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: "#couleur-marque",
      accent: "#couleur-accent",
    },
    fontFamily: {
      sans: ["Votre Police", "Inter", "sans-serif"],
    },
  },
}
```

#### Configuration Plateforme
```typescript
// src/config/brand.ts
export const BRAND_CONFIG = {
  name: "Votre Marque",
  logo: "/votre-logo.svg",
  domain: "votredomaine.com",
  supportEmail: "support@votredomaine.com",
};
```

---

### 🔒 Architecture Sécurité & Confidentialité

#### Modèle d'Authentification
- **Supabase Auth** avec fédération de fournisseurs OAuth 2.0
- **Tokens JWT** avec cycles de rafraîchissement automatiques
- **Coffre-fort de tokens chiffré** dans Supabase avec application RLS
- **Zéro secrets côté client** — toutes opérations sensibles dans edge functions

#### Souveraineté des Données
- **Row Level Security** appliqué sur toutes tables de données
- **Isolation données utilisateur** au niveau requête base de données
- **Chiffrement bout-en-bout** (HTTPS/WSS uniquement)
- **Design privacy-first** — pas d'analytics ou tracking tiers

---

### 📄 Licence

Ce projet est sous licence **MIT** — voir fichier [LICENSE](LICENSE) pour détails.

---

### 📞 Support

- **Documentation** : [docs.dona.club](https://docs.dona.club)
- **Issues** : [GitHub Issues](https://github.com/votreusername/dona-club/issues)
- **Email** : support@dona.club
- **Discord** : [Rejoindre la communauté](https://discord.gg/dona-club)

---

**Crafted with intention for a more conscious relationship with time**