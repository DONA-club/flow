# DONA.club — Visualiser

> **A temporal consciousness interface and chronological repository that transforms how humans and machines perceive, navigate, and master the lifecycle of projects. Available for white-label deployment.**

[🇫🇷 Version française](#version-française) | [🇬🇧 English version](#english-version)

---

## English Version

### 🌅 The Vision

**Visualiser** is a temporal repository that makes time visible, queryable, and actionable across human and machine scales. It conserves chronological events with microsecond precision while rendering them as intuitive circular interfaces synchronized with natural rhythms.

The core insight: **every project is a life**. Birth, growth, maturity, transmission. Visualiser captures this lifecycle as immutable temporal DNA—enabling teams, stakeholders, and systems to observe the same growth intention from their unique perspectives.

This is DONA.club's foundational tool for mastering project quality of life through temporal intelligence.

**What It Does:**

- **Temporal Repository**: Immutable event log with microsecond timestamps and full context preservation
- **Multi-Party Observation**: Same timeline viewed from human, machine, and stakeholder perspectives
- **Temporal Relativity**: Replay event sequences at different scales (circadian, microsecond, lifecycle)
- **Quality of Life Metrics**: Track project health through rhythm stability, energy levels, and delivery patterns
- **Elevation Without Constraint**: Integration that provides altitude without imposing structure

**Why It Matters:**

Projects fail not from lack of tools, but from temporal misalignment. Teams operate on different rhythms. Decisions lack historical context. Stakeholders see different realities. Machines optimize for wrong horizons.

Visualiser's intention solves this by creating a shared temporal reference—a single source of truth that adapts to each observer's natural perspective while maintaining coherence across all views.

---

### 🧬 Current Implementation

#### 🎯 For Humans: Circadian Interface

**Circular Calendar Visualization:**
- 24-hour awareness wheel with solar cycle markers (sunrise/sunset)
- Living background gradients synchronized with circadian state
- Event arcs showing temporal density and proximity
- Gestural temporal navigation (scroll/swipe through time)
- Multi-day temporal exploration

**Time Stream Integration:**
- Google Calendar synchronization (OAuth 2.0)
- Microsoft Outlook synchronization (Azure AD OAuth)
- Automatic token refresh and reconnection flows
- Multi-provider event aggregation

**Sleep Intelligence:**
- Google Fit integration for sleep data
- Sleep architecture visualization on calendar wheel
- Recovery debt/surplus tracking
- Circadian rhythm alignment indicators

**AI Companion:**
- Conversational interface with full temporal context
- OpenAI Assistants API with streaming responses
- ChatKit embedded UI for natural interaction
- Context-aware recommendations

#### 🤖 For Machines: MCP Interface

**What is MCP?**

Model Context Protocol (MCP) is an open standard that enables AI agents to interface with external tools and data sources. Visualiser exposes temporal intelligence through MCP-compatible endpoints.

**Currently Available MCP Tools:**

```typescript
// Temporal context query
temporal_context: {
  description: "Get current temporal context with all time streams";
  returns: {
    timestamp: string;
    calendar: { sunrise, sunset, virtualDate };
    events: { total, upcoming, current };
    sleep: { wakeHour, bedHour, totalSleep, debtOrCapital };
    connections: { google, microsoft, apple, facebook, amazon };
  };
}

// Upcoming events query
upcoming_events: {
  description: "Retrieve upcoming events with temporal context";
  parameters: {
    horizon: string; // e.g., "24h", "3d", "1w"
  };
  returns: {
    events: Array<{
      title: string;
      organizer: string;
      start: string;
      end: string;
      duration: number;
      timeUntil: number;
      hasVideoLink: boolean;
    }>;
  };
}
```

**MCP Integration Benefits:**
- AI agents can query temporal context before making decisions
- Agents gain understanding of project rhythms and patterns
- Shared temporal reference for human-AI collaboration

**Future MCP Capabilities** (roadmap):
- `temporal_replay`: Replay event sequences at different time scales
- `pattern_analysis`: Identify recurring temporal patterns
- `decision_archaeology`: Reconstruct context of past decisions
- `project_health`: Assess project quality of life metrics
- `record_decision`: Log decision events with full context

#### 👥 For Teams: Shared Observation

**Multi-Provider Support:**
- Google ecosystem (Calendar, Fit)
- Microsoft ecosystem (Outlook, Graph API)
- Apple, Facebook, Amazon (authentication ready)

**Temporal Navigation:**
- Scroll/swipe to navigate through time
- Virtual date/time exploration
- Automatic return to present moment
- Multi-day event loading

**Context Preservation:**
- Full page context captured for AI agents
- Device identification for session continuity
- Timezone and location awareness
- Theme and viewport adaptation

---

### 🏗️ Technical Architecture

#### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build optimization
- Tailwind CSS with custom design tokens
- shadcn/ui component library
- React Router for navigation
- TanStack Query for state management

**Backend:**
- Supabase (PostgreSQL + Auth + Edge Functions)
- Row Level Security (RLS) for data isolation
- OAuth 2.0 token management with automatic refresh
- Serverless functions (Deno runtime)

**AI Integration:**
- OpenAI Assistants API
- ChatKit for conversational UI
- Streaming responses via Server-Sent Events
- Model Context Protocol (MCP) endpoints

**Time Stream APIs:**
- Google Calendar API
- Microsoft Graph API
- Google Fit API
- Sunrise-Sunset API

**Deployment:**
- GitHub Actions CI/CD
- OVH Cloud Web hosting
- Capacitor for iOS/Android
- Service Workers for offline support

#### Data Architecture

```sql
-- OAuth token vault with automatic refresh
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- User preferences
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

**Security:**
- Row Level Security enforced on all tables
- User data isolation at database level
- Zero client-side secrets
- Encrypted token storage
- Automatic token refresh

#### Serverless Functions

**`chatkit-session`** — Initialize AI companion
```typescript
POST /functions/v1/chatkit-session
Body: { deviceId, pageContext }
Returns: { client_secret, context_sent }
```

**`google-token-refresh`** — Refresh Google tokens
```typescript
POST /functions/v1/google-token-refresh
Body: { refresh_token }
Returns: { access_token, expires_in }
```

**`microsoft-token-refresh`** — Refresh Microsoft tokens
```typescript
POST /functions/v1/microsoft-token-refresh
Body: { refresh_token, scope }
Returns: { access_token, refresh_token, expires_in }
```

**`chat`** — Streaming AI conversation
```typescript
POST /functions/v1/chat
Body: { messages, stream, thread_id }
Returns: Server-Sent Events stream
```

---

### 🎯 Roadmap: Temporal Intelligence

**Phase 1: Foundation** (Current)
- ✅ Circular calendar interface
- ✅ Multi-provider time stream integration
- ✅ Sleep intelligence tracking
- ✅ AI companion with temporal context
- ✅ Basic MCP interface

**Phase 2: Temporal Repository** (Next)
- 🔄 Immutable event log with microsecond timestamps
- 🔄 Multi-index architecture for temporal queries
- 🔄 Event context preservation
- 🔄 Role-based visibility for multi-party observation

**Phase 3: Temporal Relativity** (Future)
- 📋 Replay event sequences at different time scales
- 📋 Multi-perspective temporal archaeology
- 📋 Pattern recognition and anomaly detection
- 📋 Predictive temporal analytics

**Phase 4: Project Lifecycle** (Vision)
- 📋 Project temporal DNA capture
- 📋 Quality of life metrics tracking
- 📋 Team rhythm analysis
- 📋 Stakeholder perspective switching
- 📋 Decision context reconstruction

---

### 🚀 Implementation Guide

#### Prerequisites

- Node.js 20+ and npm 10+
- Supabase project with authentication enabled
- Google Cloud Console project (Calendar & Fit APIs)
- Microsoft Azure AD app registration (Graph API)
- OpenAI API key with Assistants API access

#### Quick Start

1. **Clone and install:**
```bash
git clone https://github.com/yourusername/dona-club.git
cd dona-club
npm install
```

2. **Configure environment:**
```bash
# Create .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. **Configure Supabase secrets:**
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

4. **Apply database migrations:**
```bash
# Execute migrations in supabase/migrations/
# Via Supabase Dashboard → SQL Editor
```

5. **Configure OAuth redirects:**
- Google Console: Add `https://your-project.supabase.co/auth/v1/callback`
- Azure Portal: Add same URL to redirect URIs

6. **Start development:**
```bash
npm run dev
```

#### Deployment

**Automated (GitHub Actions):**
```bash
# Push to main branch triggers deployment
git push origin main
```

**Manual:**
```bash
npm run build
# Upload dist/ to hosting provider
```

---

### 🎨 White-Label Deployment

Visualiser is designed for white-label deployment under your brand.

#### Brand Configuration

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
  mcpInterface: true,
};
```

---

### 📊 Temporal Context System

Visualiser generates rich contextual awareness:

```typescript
type TemporalContext = {
  timestamp: string;
  page: { url, title, pathname };
  viewport: { width, height, orientation };
  theme: { isDarkMode, colorScheme };
  calendar: {
    currentDate: string;
    virtualDate: string | null;
    displayedDay: string;
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
    currentEvent: {
      title, organizer, start, end, timeRemaining
    } | null;
  };
  sleep: {
    connected: boolean;
    wakeHour: number | null;
    bedHour: number | null;
    totalSleepHours: number | null;
    sleepSessions: Array<{ bedHour, wakeHour }> | null;
    debtOrCapital: {
      type: "debt" | "capital";
      hours: number;
      daysCount: number;
    } | null;
  };
  connections: {
    google: boolean;
    microsoft: boolean;
    apple: boolean;
    facebook: boolean;
    amazon: boolean;
  };
  user: {
    deviceId: string;
    userAgent: string;
    language: string;
    timezone: string;
  };
};
```

**Console Access:**
```javascript
window.getPageContext() // Returns complete temporal context
```

---

### 🔒 Security & Privacy

**Authentication:**
- Supabase Auth with OAuth 2.0 federation
- JWT tokens with automatic refresh
- Encrypted token vault with RLS
- Zero client-side secrets

**Data Protection:**
- Row Level Security on all tables
- User data isolation at database level
- End-to-end encryption (HTTPS/WSS)
- No third-party analytics or tracking

**Token Management:**
- Proactive refresh before expiration
- Graceful degradation on invalidation
- Clear reconnection prompts
- Secure revocation on disconnect

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

**Verification Checklist:**
- [ ] Google Calendar synchronization
- [ ] Microsoft Outlook synchronization
- [ ] Google Fit sleep data
- [ ] AI companion with context
- [ ] Theme adaptation (dark/light)
- [ ] Touch gesture navigation
- [ ] Token refresh flows
- [ ] Multi-day navigation

---

### 📈 Performance

**Optimization:**
- Code splitting with dynamic imports
- Lazy loading for routes
- Memoization of expensive computations
- Debounced API calls
- Optimistic UI updates
- Service worker caching

**Bundle Size:**
- Main bundle: ~180KB (gzipped)
- Vendor chunks: ~220KB (gzipped)
- Initial load: ~400KB total

---

### 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/enhancement`
3. Commit changes: `git commit -m 'Add enhancement'`
4. Push to branch: `git push origin feature/enhancement`
5. Open Pull Request

**Code Standards:**
- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling
- Semantic naming
- Inline documentation

---

### 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

---

### 🙏 Acknowledgments

- **OpenAI** for GPT-4 and Assistants API
- **Supabase** for backend infrastructure
- **Vercel** for shadcn/ui components
- **Radix UI** for accessible primitives
- **Lucide** for iconography
- **Anthropic** for Model Context Protocol standard

---

### 📞 Support

- **Documentation**: [docs.dona.club](https://docs.dona.club)
- **Issues**: [GitHub Issues](https://github.com/yourusername/dona-club/issues)
- **Email**: support@dona.club
- **Discord**: [Join our community](https://discord.gg/dona-club)

---

## Version Française

### 🌅 La Vision

**Visualiser** est un référentiel temporel qui rend le temps visible, interrogeable et actionnable à travers les échelles humaines et machines. Il conserve les événements chronologiques avec une précision microseconde tout en les rendant sous forme d'interfaces circulaires intuitives synchronisées avec les rythmes naturels.

L'insight central : **chaque projet est une vie**. Naissance, croissance, maturité, transmission. Visualiser capture ce cycle de vie comme ADN temporel immuable—permettant aux équipes, parties prenantes et systèmes d'observer la même intention de croissance depuis leurs perspectives uniques.

C'est l'outil fondateur de DONA.club pour maîtriser la qualité de vie des projets à travers l'intelligence temporelle.

**Ce Qu'il Fait :**

- **Référentiel Temporel** : Log d'événements immuable avec timestamps microseconde et préservation contexte complet
- **Observation Multipartite** : Même chronologie vue depuis perspectives humaine, machine et parties prenantes
- **Relativité Temporelle** : Rejouer séquences événements à différentes échelles (circadienne, microseconde, lifecycle)
- **Métriques Qualité de Vie** : Suivre santé projet via stabilité rythmes, niveaux énergie et patterns livraison
- **Élévation Sans Contrainte** : Intégration qui fournit altitude sans imposer structure

**Pourquoi C'est Important :**

Les projets échouent non par manque d'outils, mais par désalignement temporel. Les équipes opèrent sur différents rythmes. Les décisions manquent de contexte historique. Les parties prenantes voient différentes réalités. Les machines optimisent pour mauvais horizons.

L'intention de Visualiser résout ceci en créant une référence temporelle partagée—une source unique de vérité qui s'adapte à la perspective naturelle de chaque observateur tout en maintenant cohérence à travers toutes les vues.

---

### 🔒 Sécurité & Confidentialité

**Authentification :**
- Supabase Auth avec fédération OAuth 2.0
- Tokens JWT avec rafraîchissement automatique
- Coffre-fort tokens chiffré avec RLS
- Zéro secrets côté client

**Protection Données :**
- Row Level Security sur toutes tables
- Isolation données utilisateur
- Chiffrement bout-en-bout (HTTPS/WSS)
- Pas analytics ou tracking tiers

---

### 📄 Licence

Licence MIT.

---

### 📞 Support

- **Issues** : [GitHub Issues](https://github.com/sachaulysse/dona-club/issues)
- **Email** : conscience@dona.club
- **Discord** : [Rejoindre communauté](https://discord.gg/6gXjVhacp)

---

**Built for clarity, designed for elevation**