# DONA.club — Circular Calendar Platform

> **A white-label temporal intelligence platform that reimagines how humans interact with time, events, and personal rhythms.**

[🇫🇷 Version française](#version-française) | [🇬🇧 English version](#english-version)

---

## English Version

### 🌅 Vision

DONA.club is not just another calendar application—it's a **temporal consciousness platform** that harmonizes your digital life with natural circadian rhythms. By visualizing time as a continuous circle rather than a linear grid, we help users develop a more intuitive, holistic relationship with their daily schedules.

**Core Philosophy:**
- **Circadian-First Design**: Time visualization adapts to your sleep-wake cycles and natural light patterns
- **Multi-Provider Harmony**: Seamlessly unify Google, Microsoft, and other calendars into one coherent view
- **Contextual Intelligence**: AI assistant with full awareness of your schedule, location, and temporal context
- **Ambient Interface**: Information appears when needed, fades when not—respecting attention as a finite resource

---

### ✨ Key Features

#### 🎯 Circular Time Visualization
- **24-hour wheel interface** with sunrise/sunset markers
- **Dynamic background gradients** that shift with your circadian rhythm
- **Event arcs** that show duration and proximity at a glance
- **Sleep overlay** visualizing rest periods and sleep debt/capital
- **Scroll through time** with intuitive wheel/swipe gestures

#### 🔗 Universal Calendar Integration
- **Google Calendar** with automatic token refresh
- **Microsoft Outlook** (Office 365) with Graph API integration
- **Multi-account support** via OAuth token management
- **Real-time synchronization** across all connected providers
- **Conflict-free merging** of events from multiple sources

#### 😴 Sleep Intelligence (Google Fit)
- **Automatic sleep tracking** from Google Fit sessions
- **Sleep debt calculation** over rolling 7-day windows
- **Ideal bedtime recommendations** based on wake patterns
- **Visual sleep overlays** on the circular calendar
- **Historical sleep data** for any past date

#### 🤖 AI Assistant (OpenAI Assistants API)
- **Full page context awareness**: calendar, sleep, location, theme, connections
- **Natural language queries**: "What's my next meeting?", "How's my sleep?"
- **Tool execution**: Can analyze your schedule and provide insights
- **Streaming responses** with real-time tool activity indicators
- **Persistent conversation threads** across sessions

#### 🎨 Adaptive Design
- **System theme detection** (dark/light mode)
- **Circadian background gradients** that evolve throughout the day
- **Golden ratio sizing** for optimal visual harmony
- **Mobile-first responsive** design with touch gestures
- **Accessibility-focused** with ARIA labels and semantic HTML

---

### 🏗️ Architecture

#### Technology Stack

**Frontend:**
- **React 18** with TypeScript for type-safe component development
- **Vite** for lightning-fast builds and HMR
- **Tailwind CSS** for utility-first styling with custom design system
- **shadcn/ui** for accessible, customizable UI components
- **React Router** for client-side navigation
- **TanStack Query** for server state management

**Backend & Services:**
- **Supabase** for authentication, database, and edge functions
- **PostgreSQL** with Row Level Security for data isolation
- **Supabase Edge Functions** (Deno runtime) for serverless API endpoints
- **OpenAI Assistants API** for conversational AI with tool support
- **ChatKit** for embedded chat UI with streaming support

**APIs & Integrations:**
- **Google Calendar API** (OAuth 2.0)
- **Microsoft Graph API** (Azure AD OAuth)
- **Google Fit API** for sleep data
- **Sunrise-Sunset API** for solar calculations
- **OpenAI GPT-4** for natural language understanding

**Infrastructure:**
- **GitHub Actions** for CI/CD pipeline
- **OVH Cloud Web** for production hosting
- **Capacitor** for iOS/Android native builds
- **Service Workers** for offline capabilities

#### Database Schema

```sql
-- OAuth token storage with automatic refresh
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

-- User preferences for UI state persistence
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

**Row Level Security (RLS):**
- All tables have RLS enabled by default
- Users can only access their own data
- Service role bypasses RLS for admin operations

#### Edge Functions

**`chatkit-session`** — Creates OpenAI ChatKit sessions with page context
```typescript
POST /functions/v1/chatkit-session
Body: { deviceId, pageContext }
Returns: { client_secret, context_sent }
```

**`google-token-refresh`** — Refreshes expired Google OAuth tokens
```typescript
POST /functions/v1/google-token-refresh
Body: { refresh_token }
Returns: { access_token, expires_in }
```

**`microsoft-token-refresh`** — Refreshes expired Microsoft OAuth tokens
```typescript
POST /functions/v1/microsoft-token-refresh
Body: { refresh_token, scope }
Returns: { access_token, refresh_token, expires_in }
```

**`chat`** — OpenAI Assistants API streaming endpoint
```typescript
POST /functions/v1/chat
Body: { messages, stream, thread_id }
Returns: Server-Sent Events stream
```

---

### 🚀 Getting Started

#### Prerequisites

- **Node.js 20+** and npm 10+
- **Supabase account** with project created
- **Google Cloud Console** project with Calendar & Fit APIs enabled
- **Microsoft Azure AD** app registration with Graph API permissions
- **OpenAI API key** with Assistants API access

#### Environment Setup

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/dona-club.git
cd dona-club
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Supabase:**
```bash
# Create .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Set up Supabase secrets:**
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

5. **Run database migrations:**
```bash
# Migrations are in supabase/migrations/
# Apply via Supabase Dashboard → SQL Editor
```

6. **Configure OAuth redirect URIs:**
- **Google Console**: Add `https://your-project.supabase.co/auth/v1/callback`
- **Azure Portal**: Add same URL to redirect URIs

#### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Deployment

**Automatic (GitHub Actions):**
```yaml
# .github/workflows/deploy-ovh.yml
# Triggers on push to main branch
# Deploys to OVH Cloud Web via FTP
```

**Manual:**
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

---

### 🎨 White-Label Customization

DONA.club is designed as a **white-label platform** that can be fully customized:

#### Branding
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

#### Configuration
```typescript
// src/config/brand.ts
export const BRAND_CONFIG = {
  name: "Your Brand",
  logo: "/your-logo.svg",
  domain: "yourdomain.com",
  supportEmail: "support@yourdomain.com",
};
```

#### Features
```typescript
// src/config/features.ts
export const FEATURES = {
  googleCalendar: true,
  microsoftCalendar: true,
  sleepTracking: true,
  aiAssistant: true,
  // Toggle features per deployment
};
```

---

### 📊 Page Context System

The platform generates rich contextual data for the AI assistant:

```typescript
type PageContext = {
  timestamp: string;
  page: { url, title, pathname };
  viewport: { width, height, orientation };
  theme: { isDarkMode, colorScheme };
  calendar: {
    currentDate: string;
    virtualDate: string | null;
    sunrise: number;
    sunset: number;
    latitude: number | null;
    longitude: number | null;
  };
  events: {
    total: number;
    upcoming: Array<{
      title, organizer, start, end, duration,
      timeUntil, location, hasVideoLink, url
    }>;
    currentEvent: { title, organizer, start, end, timeRemaining } | null;
  };
  sleep: {
    connected: boolean;
    wakeHour: number | null;
    bedHour: number | null;
    totalSleepHours: number | null;
    debtOrCapital: { type, hours, daysCount } | null;
  };
  connections: { google, microsoft, apple, facebook, amazon };
  user: { deviceId, userAgent, language, timezone };
};
```

**Access in browser console:**
```javascript
window.getPageContext() // Returns full context object
```

---

### 🔒 Security & Privacy

#### Authentication
- **Supabase Auth** with OAuth 2.0 providers
- **JWT tokens** with automatic refresh
- **Secure token storage** in Supabase database with RLS
- **No client-side secrets** — all sensitive operations in edge functions

#### Data Protection
- **Row Level Security** on all database tables
- **User data isolation** — users can only access their own records
- **Encrypted connections** (HTTPS/WSS only)
- **No third-party analytics** — privacy-first approach

#### OAuth Token Management
- **Automatic token refresh** before expiration
- **Graceful degradation** when tokens expire
- **Clear error messages** prompting reconnection
- **Token revocation** on disconnect

---

### 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build
```

**Manual Testing Checklist:**
- [ ] Google Calendar sync with multiple events
- [ ] Microsoft Calendar sync with recurring events
- [ ] Sleep data from Google Fit
- [ ] AI assistant with page context
- [ ] Theme switching (dark/light)
- [ ] Mobile touch gestures
- [ ] Token refresh on expiration
- [ ] Multi-day event loading

---

### 📈 Performance

**Optimization Strategies:**
- **Code splitting** with dynamic imports
- **Lazy loading** for routes and heavy components
- **Memoization** of expensive calculations (sun times, event filtering)
- **Debounced API calls** to prevent rate limiting
- **Optimistic UI updates** for instant feedback
- **Service worker caching** for offline support

**Bundle Size:**
- Main bundle: ~180KB (gzipped)
- Vendor chunks: ~220KB (gzipped)
- Total initial load: ~400KB

---

### 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

**Code Style:**
- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling
- Descriptive variable names
- Comments for complex logic

---

### 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

---

### 🙏 Acknowledgments

- **OpenAI** for GPT-4 and Assistants API
- **Supabase** for backend infrastructure
- **Vercel** for shadcn/ui components
- **Radix UI** for accessible primitives
- **Lucide** for beautiful icons

---

### 📞 Support

- **Documentation**: [docs.dona.club](https://docs.dona.club)
- **Issues**: [GitHub Issues](https://github.com/yourusername/dona-club/issues)
- **Email**: support@dona.club
- **Discord**: [Join our community](https://discord.gg/dona-club)

---

## Version Française

### 🌅 Vision

DONA.club n'est pas simplement une application de calendrier—c'est une **plateforme d'intelligence temporelle** qui harmonise votre vie numérique avec vos rythmes circadiens naturels. En visualisant le temps comme un cercle continu plutôt qu'une grille linéaire, nous aidons les utilisateurs à développer une relation plus intuitive et holistique avec leurs emplois du temps.

**Philosophie fondamentale :**
- **Design circadien prioritaire** : La visualisation du temps s'adapte à vos cycles veille-sommeil et aux variations de lumière naturelle
- **Harmonie multi-fournisseurs** : Unifiez Google, Microsoft et d'autres calendriers en une vue cohérente
- **Intelligence contextuelle** : Assistant IA avec conscience complète de votre agenda, localisation et contexte temporel
- **Interface ambiante** : L'information apparaît quand nécessaire, s'estompe sinon—respectant l'attention comme ressource finie

---

### ✨ Fonctionnalités Clés

#### 🎯 Visualisation Circulaire du Temps
- **Interface en roue de 24 heures** avec marqueurs lever/coucher du soleil
- **Dégradés d'arrière-plan dynamiques** qui évoluent avec votre rythme circadien
- **Arcs d'événements** montrant durée et proximité d'un coup d'œil
- **Superposition du sommeil** visualisant périodes de repos et dette/capital de sommeil
- **Navigation temporelle** avec gestes intuitifs de molette/balayage

#### 🔗 Intégration Calendrier Universelle
- **Google Calendar** avec rafraîchissement automatique des tokens
- **Microsoft Outlook** (Office 365) avec intégration Graph API
- **Support multi-comptes** via gestion de tokens OAuth
- **Synchronisation temps réel** sur tous les fournisseurs connectés
- **Fusion sans conflit** des événements de sources multiples

#### 😴 Intelligence Sommeil (Google Fit)
- **Suivi automatique du sommeil** depuis les sessions Google Fit
- **Calcul de dette de sommeil** sur fenêtres glissantes de 7 jours
- **Recommandations d'heure de coucher** basées sur les patterns de réveil
- **Superpositions visuelles du sommeil** sur le calendrier circulaire
- **Données historiques** pour n'importe quelle date passée

#### 🤖 Assistant IA (OpenAI Assistants API)
- **Conscience contextuelle complète** : calendrier, sommeil, localisation, thème, connexions
- **Requêtes en langage naturel** : "Quelle est ma prochaine réunion ?", "Comment va mon sommeil ?"
- **Exécution d'outils** : Peut analyser votre emploi du temps et fournir des insights
- **Réponses en streaming** avec indicateurs d'activité des outils en temps réel
- **Fils de conversation persistants** entre sessions

#### 🎨 Design Adaptatif
- **Détection du thème système** (mode sombre/clair)
- **Dégradés circadiens** évoluant tout au long de la journée
- **Dimensionnement nombre d'or** pour harmonie visuelle optimale
- **Design responsive mobile-first** avec gestes tactiles
- **Axé accessibilité** avec labels ARIA et HTML sémantique

---

### 🏗️ Architecture

#### Stack Technologique

**Frontend :**
- **React 18** avec TypeScript pour développement type-safe
- **Vite** pour builds ultra-rapides et HMR
- **Tailwind CSS** pour styling utility-first avec système de design personnalisé
- **shadcn/ui** pour composants UI accessibles et personnalisables
- **React Router** pour navigation côté client
- **TanStack Query** pour gestion d'état serveur

**Backend & Services :**
- **Supabase** pour authentification, base de données et edge functions
- **PostgreSQL** avec Row Level Security pour isolation des données
- **Supabase Edge Functions** (runtime Deno) pour endpoints API serverless
- **OpenAI Assistants API** pour IA conversationnelle avec support d'outils
- **ChatKit** pour UI de chat embarquée avec streaming

**APIs & Intégrations :**
- **Google Calendar API** (OAuth 2.0)
- **Microsoft Graph API** (Azure AD OAuth)
- **Google Fit API** pour données de sommeil
- **Sunrise-Sunset API** pour calculs solaires
- **OpenAI GPT-4** pour compréhension du langage naturel

**Infrastructure :**
- **GitHub Actions** pour pipeline CI/CD
- **OVH Cloud Web** pour hébergement production
- **Capacitor** pour builds natifs iOS/Android
- **Service Workers** pour capacités offline

#### Schéma Base de Données

```sql
-- Stockage tokens OAuth avec rafraîchissement automatique
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

-- Préférences utilisateur pour persistance état UI
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

**Row Level Security (RLS) :**
- Toutes les tables ont RLS activé par défaut
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Le rôle service contourne RLS pour opérations admin

---

### 🚀 Démarrage

#### Prérequis

- **Node.js 20+** et npm 10+
- **Compte Supabase** avec projet créé
- **Projet Google Cloud Console** avec APIs Calendar & Fit activées
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

3. **Configurer Supabase :**
```bash
# Créer .env.local
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

4. **Configurer les secrets Supabase :**
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

5. **Exécuter les migrations :**
```bash
# Les migrations sont dans supabase/migrations/
# Appliquer via Dashboard Supabase → SQL Editor
```

6. **Configurer les URIs de redirection OAuth :**
- **Console Google** : Ajouter `https://votre-projet.supabase.co/auth/v1/callback`
- **Portail Azure** : Ajouter même URL aux URIs de redirection

#### Développement

```bash
# Démarrer serveur dev
npm run dev

# Build pour production
npm run build

# Prévisualiser build production
npm run preview
```

---

### 🎨 Personnalisation Marque Blanche

DONA.club est conçu comme **plateforme marque blanche** entièrement personnalisable :

#### Image de Marque
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

#### Configuration
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

### 🔒 Sécurité & Confidentialité

#### Authentification
- **Supabase Auth** avec fournisseurs OAuth 2.0
- **Tokens JWT** avec rafraîchissement automatique
- **Stockage sécurisé** dans base Supabase avec RLS
- **Pas de secrets côté client** — opérations sensibles dans edge functions

#### Protection Données
- **Row Level Security** sur toutes les tables
- **Isolation données utilisateur** — accès uniquement à ses propres enregistrements
- **Connexions chiffrées** (HTTPS/WSS uniquement)
- **Pas d'analytics tiers** — approche privacy-first

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

**Made with ❤️ for a more harmonious relationship with time**