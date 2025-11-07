# DONA.club — Visualiser

> **A temporal consciousness interface and chronological repository that transforms how humans and machines perceive, navigate, and master the lifecycle of projects.**

[🇫🇷 Version française](#version-française) | [🇬🇧 English version](#english-version)

---

## English Version

### 🌅 The Vision

**Visualiser** is not a calendar—it's a **temporal repository and consciousness instrument** that reveals the invisible architecture of time itself. By rendering temporal flows as living, breathing circles synchronized with natural and project rhythms, Visualiser helps both humans and machines develop an intuitive, embodied relationship with temporal existence.

This is the foundational manifestation of **DONA.club's broader ambition**: to master the quality of life across projects, organizations, and individuals through temporal intelligence. **Every project is a life**—and Visualiser is the heart of mastering that life.

**Core Principles:**

- **Temporal Repository**: Conserves and indexes chronological events for retrospective analysis and temporal relativity
- **Multi-Scale Consciousness**: Operates from human circadian rhythms to machine decision horizons (embedded systems, sliding windows)
- **Project Lifecycle Mastery**: Represents the complete temporal DNA of a project—every decision, every event, every rhythm
- **Temporal Relativity**: Enables replay and reinterpretation of event chronologies across different time scales and perspectives
- **Machine-Readable Time**: Designed for both human perception and high-level machine coordination protocols (MCP)

---

### 🧬 What Visualiser Represents

#### 🎯 For Humans: Circadian Consciousness
- **24-hour awareness wheel** with solar cycle markers (sunrise/sunset)
- **Living background gradients** that breathe with your biological state
- **Event arcs** revealing temporal density and proximity
- **Sleep architecture overlay** showing rest patterns and recovery debt/surplus
- **Temporal navigation** through intuitive gestures (scroll/swipe through time)

#### 🤖 For Machines: Temporal Coordination Protocol
- **Chronological event repository** with microsecond precision indexing
- **Decision timeline reconstruction** for embedded systems and autonomous agents
- **Sliding horizon windows** for real-time temporal planning
- **Temporal relativity engine** for replaying event sequences at different scales
- **MCP-compatible interface** for high-level machine coordination

#### 🔄 Temporal Relativity & Replay
- **Event chronology conservation** with immutable temporal records
- **Multi-scale temporal replay**: View project lifecycles at day/week/month/year scales
- **Decision archaeology**: Reconstruct the temporal context of past decisions
- **Temporal pattern recognition**: Identify recurring rhythms and anomalies
- **Project lifecycle visualization**: See the complete temporal DNA of any project

#### 🌐 Universal Time Streams
- **Human time streams**: Google, Microsoft, personal schedules
- **Machine time streams**: System logs, decision events, sensor data
- **Project time streams**: Milestones, deliverables, team activities
- **Natural time streams**: Solar cycles, seasonal patterns, circadian rhythms
- **Unified temporal view**: All streams merged into coherent temporal reality

---

### 🏛️ Architectural Philosophy

Visualiser is built on three foundational layers:

#### 1. **Temporal Repository Layer**
The immutable chronological database that conserves all temporal events:

```typescript
type TemporalEvent = {
  id: string;
  timestamp: number; // Unix microseconds
  type: "human" | "machine" | "natural" | "project";
  source: string; // Origin stream (google, system, sensor, etc.)
  payload: any; // Event-specific data
  context: TemporalContext; // Full contextual snapshot
  metadata: {
    timezone: string;
    location?: { lat: number; lon: number };
    actor?: string; // Human or machine identifier
    decision?: boolean; // Was this a decision point?
  };
};
```

**Repository Capabilities:**
- **Immutable append-only log** of all temporal events
- **Microsecond precision** for machine coordination
- **Full context preservation** for temporal archaeology
- **Multi-stream indexing** for cross-temporal queries
- **Temporal relativity queries**: "Show me all events between T1 and T2 from perspective of actor X"

#### 2. **Consciousness Interface Layer**
The human-facing circular visualization that makes time intuitive:

- **Circadian-synchronized rendering** for biological alignment
- **Event arc visualization** for temporal density perception
- **Gestural temporal navigation** for intuitive time travel
- **Ambient information emergence** respecting attention as sacred
- **AI companion** with full temporal context awareness

#### 3. **Machine Coordination Layer**
The protocol interface for autonomous systems and embedded devices:

```typescript
// MCP (Machine Coordination Protocol) Interface
interface MCPTemporalInterface {
  // Query temporal events within horizon window
  queryHorizon(start: number, end: number, filters?: EventFilter[]): TemporalEvent[];
  
  // Register decision event with full context
  recordDecision(decision: Decision, context: TemporalContext): void;
  
  // Replay event sequence at different time scale
  replaySequence(start: number, end: number, scale: TimeScale): EventSequence;
  
  // Get temporal patterns for prediction
  analyzePatterns(window: TimeWindow): TemporalPattern[];
  
  // Synchronize with other temporal systems
  syncWithPeer(peerId: string, protocol: SyncProtocol): void;
}
```

**Machine Use Cases:**
- **Embedded systems**: Log decision events with temporal context
- **Autonomous agents**: Query sliding horizon windows for planning
- **Distributed systems**: Synchronize temporal state across nodes
- **Temporal analytics**: Analyze decision patterns over project lifecycle
- **Predictive systems**: Learn from historical temporal patterns

---

### 🌊 Temporal Relativity: The Core Innovation

Visualiser's most profound capability is **temporal relativity**—the ability to replay and reinterpret event chronologies from different perspectives and time scales.

#### Temporal Replay Modes

**1. Human Scale (Circadian)**
```typescript
// View project lifecycle at human circadian rhythm
visualiser.replay({
  start: projectStart,
  end: projectEnd,
  scale: "circadian", // 24-hour cycles
  perspective: "human",
  focus: ["meetings", "decisions", "sleep"]
});
```

**2. Machine Scale (Microseconds)**
```typescript
// View system decision timeline at microsecond precision
visualiser.replay({
  start: incidentStart,
  end: incidentEnd,
  scale: "microsecond",
  perspective: "machine",
  focus: ["decisions", "state_changes", "errors"]
});
```

**3. Project Scale (Lifecycle)**
```typescript
// View entire project lifecycle compressed to single wheel
visualiser.replay({
  start: projectStart,
  end: projectEnd,
  scale: "lifecycle", // Entire project as one circle
  perspective: "project",
  focus: ["milestones", "team_rhythm", "decision_density"]
});
```

#### Temporal Archaeology

Reconstruct the complete context of any past moment:

```typescript
// What was the temporal state when decision X was made?
const context = visualiser.archaeology({
  moment: decisionTimestamp,
  radius: "24h", // Look 24h before and after
  include: [
    "all_events",
    "team_state",
    "project_health",
    "external_factors",
    "circadian_state"
  ]
});
```

---

### 🎯 Project Lifecycle Mastery

**Every project is a life**—with birth, growth, maturity, and completion. Visualiser represents the complete temporal DNA of that life.

#### Project Temporal DNA

```typescript
type ProjectTemporalDNA = {
  // Birth: Project inception
  genesis: {
    timestamp: number;
    initiators: string[];
    initialContext: TemporalContext;
  };
  
  // Growth: Development phases
  phases: Array<{
    name: string;
    start: number;
    end: number;
    keyEvents: TemporalEvent[];
    teamRhythm: CircadianPattern;
    decisionDensity: number; // Decisions per day
  }>;
  
  // Maturity: Stable operation
  maturity: {
    sustainedRhythm: CircadianPattern;
    maintenanceEvents: TemporalEvent[];
    evolutionRate: number; // Change velocity
  };
  
  // Completion: Project closure
  completion?: {
    timestamp: number;
    finalContext: TemporalContext;
    retrospective: TemporalAnalysis;
  };
  
  // Vital Signs: Project health over time
  vitalSigns: {
    decisionQuality: TimeSeries;
    teamEnergy: TimeSeries;
    deliveryRhythm: TimeSeries;
    externalPressure: TimeSeries;
  };
};
```

#### Lifecycle Visualization

Visualiser can render the entire project lifecycle as:

1. **Compressed Circle**: Entire project as single 24-hour wheel
2. **Expanded Timeline**: Scrollable multi-day/week/month view
3. **Phase Comparison**: Overlay different project phases
4. **Team Rhythm Analysis**: Visualize team circadian patterns over project life
5. **Decision Archaeology**: Reconstruct context of critical decisions

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
- **TimescaleDB extension** for time-series temporal data
- **Supabase Edge Functions** (Deno runtime) for serverless compute
- **OpenAI Assistants API** for conversational intelligence with tool use
- **ChatKit** for embedded conversational UI with streaming

**Integration Layer:**
- **Google Calendar API** (OAuth 2.0) for human time streams
- **Microsoft Graph API** (Azure AD OAuth) for organizational time streams
- **Google Fit API** for biometric temporal data
- **Sunrise-Sunset API** for natural cycle calculations
- **OpenAI GPT-4** for natural language temporal understanding
- **Custom MCP endpoints** for machine coordination

**Temporal Repository:**
- **Append-only event log** with microsecond timestamps
- **Multi-index architecture** for fast temporal queries
- **Immutable event storage** for temporal archaeology
- **Compression algorithms** for long-term storage efficiency
- **Replication protocol** for distributed temporal systems

**Deployment:**
- **GitHub Actions** for continuous deployment
- **OVH Cloud Web** for production hosting
- **Capacitor** for native iOS/Android compilation
- **Docker containers** for embedded system deployment
- **Service Workers** for offline resilience

#### Data Architecture

```sql
-- Temporal event repository (append-only)
CREATE TABLE temporal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp BIGINT NOT NULL, -- Unix microseconds
  event_type TEXT NOT NULL, -- 'human', 'machine', 'natural', 'project'
  source TEXT NOT NULL, -- Origin stream identifier
  actor TEXT, -- Human or machine identifier
  payload JSONB NOT NULL, -- Event-specific data
  context JSONB NOT NULL, -- Full temporal context snapshot
  metadata JSONB, -- Additional metadata
  is_decision BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for temporal queries
CREATE INDEX idx_temporal_events_timestamp ON temporal_events(timestamp);
CREATE INDEX idx_temporal_events_type ON temporal_events(event_type);
CREATE INDEX idx_temporal_events_source ON temporal_events(source);
CREATE INDEX idx_temporal_events_actor ON temporal_events(actor);

-- Project lifecycle tracking
CREATE TABLE project_lifecycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL,
  genesis_timestamp BIGINT NOT NULL,
  completion_timestamp BIGINT,
  temporal_dna JSONB NOT NULL, -- Complete project temporal DNA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
- Temporal event immutability enforced at database level

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

**`temporal-query`** — Query temporal repository (MCP interface)
```typescript
POST /functions/v1/temporal-query
Body: { start, end, filters, perspective }
Returns: { events: TemporalEvent[], patterns: TemporalPattern[] }
```

**`temporal-replay`** — Replay event sequence at different scale
```typescript
POST /functions/v1/temporal-replay
Body: { start, end, scale, perspective, focus }
Returns: { sequence: EventSequence, analysis: TemporalAnalysis }
```

---

### 🚀 Implementation Guide

#### Prerequisites

- **Node.js 20+** and npm 10+
- **Supabase project** with authentication enabled
- **Google Cloud Console** project with Calendar & Fit APIs
- **Microsoft Azure AD** app registration with Graph API permissions
- **OpenAI API key** with Assistants API access
- **TimescaleDB** extension enabled in Supabase (for time-series data)

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

6. **Enable TimescaleDB extension:**
```sql
-- In Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert temporal_events to hypertable
SELECT create_hypertable('temporal_events', 'timestamp', 
  chunk_time_interval => 86400000000); -- 1 day in microseconds
```

7. **Configure OAuth redirect URIs:**
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
  // Human features
  googleIntegration: true,
  microsoftIntegration: true,
  sleepIntelligence: true,
  aiCompanion: true,
  
  // Machine features
  mcpInterface: true,
  temporalReplay: true,
  decisionArchaeology: true,
  projectLifecycle: true,
  
  // Modular feature activation per deployment
};
```

---

### 📊 Temporal Context System

Visualiser generates rich contextual awareness for both humans and machines:

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
  
  // Machine-specific context
  machine?: {
    systemState: any;
    decisionHorizon: { start: number; end: number };
    activeProcesses: string[];
    resourceUtilization: { cpu: number; memory: number };
  };
  
  // Project-specific context
  project?: {
    id: string;
    phase: string;
    health: number; // 0-100
    teamRhythm: CircadianPattern;
    nextMilestone: { name: string; timestamp: number };
  };
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
- **Machine authentication** via API keys with scope-based permissions

#### Data Sovereignty
- **Row Level Security** enforced on all data tables
- **User data isolation** at database query level
- **Temporal event immutability** enforced at database level
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
- [ ] Temporal replay at different scales
- [ ] MCP interface for machine coordination
- [ ] Project lifecycle visualization

---

### 📈 Performance Characteristics

**Optimization Strategy:**
- **Code splitting** with dynamic imports
- **Lazy loading** for routes and heavy components
- **Memoization** of expensive computations (solar calculations, event filtering)
- **Debounced API calls** to respect rate limits
- **Optimistic UI updates** for perceived performance
- **Service worker caching** for offline resilience
- **TimescaleDB compression** for long-term temporal data
- **Indexed temporal queries** for microsecond-precision lookups

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
- Temporal event immutability

---

### 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

---

### 🙏 Acknowledgments

- **OpenAI** for GPT-4 and Assistants API
- **Supabase** for backend infrastructure
- **TimescaleDB** for time-series database capabilities
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

**Visualiser** n'est pas un calendrier—c'est un **référentiel temporel et instrument de conscience** qui révèle l'architecture invisible du temps lui-même. En représentant les flux temporels comme des cercles vivants, synchronisés avec les rythmes naturels et projets, Visualiser aide humains et machines à développer une relation intuitive et incarnée avec l'existence temporelle.

C'est la manifestation fondatrice de **l'ambition plus large de DONA.club** : maîtriser la qualité de vie des projets, organisations et individus à travers l'intelligence temporelle. **Chaque projet est une vie**—et Visualiser est le cœur de la maîtrise de cette vie.

**Principes Fondamentaux :**

- **Référentiel Temporel** : Conserve et indexe les événements chronologiques pour analyse rétrospective et relativité temporelle
- **Conscience Multi-Échelle** : Opère des rythmes circadiens humains aux horizons de décision machine (systèmes embarqués, fenêtres glissantes)
- **Maîtrise du Cycle de Vie Projet** : Représente l'ADN temporel complet d'un projet—chaque décision, chaque événement, chaque rythme
- **Relativité Temporelle** : Permet la relecture et réinterprétation des chronologies d'événements à différentes échelles et perspectives
- **Temps Lisible Machine** : Conçu pour perception humaine et protocoles de coordination machine haut niveau (MCP)

---

### 🧬 Ce que Représente Visualiser

#### 🎯 Pour les Humains : Conscience Circadienne
- **Roue de conscience 24 heures** avec marqueurs de cycle solaire (lever/coucher)
- **Dégradés d'arrière-plan vivants** qui respirent avec votre état biologique
- **Arcs d'événements** révélant densité et proximité temporelles
- **Superposition d'architecture du sommeil** montrant patterns de repos et dette/surplus de récupération
- **Navigation temporelle** par gestes intuitifs (défilement/balayage dans le temps)

#### 🤖 Pour les Machines : Protocole de Coordination Temporelle
- **Référentiel d'événements chronologiques** avec indexation précision microseconde
- **Reconstruction de chronologie de décisions** pour systèmes embarqués et agents autonomes
- **Fenêtres d'horizon glissant** pour planification temporelle temps réel
- **Moteur de relativité temporelle** pour rejouer séquences d'événements à différentes échelles
- **Interface compatible MCP** pour coordination machine haut niveau

#### 🔄 Relativité Temporelle & Relecture
- **Conservation de chronologie d'événements** avec enregistrements temporels immuables
- **Relecture temporelle multi-échelle** : Visualiser cycles de vie projet à échelles jour/semaine/mois/année
- **Archéologie de décisions** : Reconstruire le contexte temporel de décisions passées
- **Reconnaissance de patterns temporels** : Identifier rythmes récurrents et anomalies
- **Visualisation cycle de vie projet** : Voir l'ADN temporel complet de tout projet

#### 🌐 Flux Temporels Universels
- **Flux temporels humains** : Google, Microsoft, agendas personnels
- **Flux temporels machine** : Logs système, événements de décision, données capteurs
- **Flux temporels projet** : Jalons, livrables, activités équipe
- **Flux temporels naturels** : Cycles solaires, patterns saisonniers, rythmes circadiens
- **Vue temporelle unifiée** : Tous flux fusionnés en réalité temporelle cohérente

---

### 🏛️ Philosophie Architecturale

Visualiser est construit sur trois couches fondamentales :

#### 1. **Couche Référentiel Temporel**
La base de données chronologique immuable qui conserve tous événements temporels :

```typescript
type TemporalEvent = {
  id: string;
  timestamp: number; // Microsecondes Unix
  type: "human" | "machine" | "natural" | "project";
  source: string; // Flux d'origine (google, system, sensor, etc.)
  payload: any; // Données spécifiques événement
  context: TemporalContext; // Snapshot contextuel complet
  metadata: {
    timezone: string;
    location?: { lat: number; lon: number };
    actor?: string; // Identifiant humain ou machine
    decision?: boolean; // Était-ce un point de décision ?
  };
};
```

**Capacités du Référentiel :**
- **Log append-only immuable** de tous événements temporels
- **Précision microseconde** pour coordination machine
- **Préservation contexte complet** pour archéologie temporelle
- **Indexation multi-flux** pour requêtes cross-temporelles
- **Requêtes relativité temporelle** : "Montrer tous événements entre T1 et T2 depuis perspective acteur X"

#### 2. **Couche Interface de Conscience**
La visualisation circulaire orientée humain qui rend le temps intuitif :

- **Rendu synchronisé circadien** pour alignement biologique
- **Visualisation arcs d'événements** pour perception densité temporelle
- **Navigation temporelle gestuelle** pour voyage temporel intuitif
- **Émergence information ambiante** respectant attention comme sacrée
- **Compagnon IA** avec conscience contextuelle temporelle complète

#### 3. **Couche Coordination Machine**
L'interface protocole pour systèmes autonomes et dispositifs embarqués :

```typescript
// Interface MCP (Machine Coordination Protocol)
interface MCPTemporalInterface {
  // Requête événements temporels dans fenêtre horizon
  queryHorizon(start: number, end: number, filters?: EventFilter[]): TemporalEvent[];
  
  // Enregistrer événement décision avec contexte complet
  recordDecision(decision: Decision, context: TemporalContext): void;
  
  // Rejouer séquence événements à échelle temporelle différente
  replaySequence(start: number, end: number, scale: TimeScale): EventSequence;
  
  // Obtenir patterns temporels pour prédiction
  analyzePatterns(window: TimeWindow): TemporalPattern[];
  
  // Synchroniser avec autres systèmes temporels
  syncWithPeer(peerId: string, protocol: SyncProtocol): void;
}
```

**Cas d'Usage Machine :**
- **Systèmes embarqués** : Logger événements décision avec contexte temporel
- **Agents autonomes** : Requêter fenêtres horizon glissant pour planification
- **Systèmes distribués** : Synchroniser état temporel entre nœuds
- **Analytics temporels** : Analyser patterns décision sur cycle vie projet
- **Systèmes prédictifs** : Apprendre depuis patterns temporels historiques

---

### 🌊 Relativité Temporelle : L'Innovation Centrale

La capacité la plus profonde de Visualiser est la **relativité temporelle**—la capacité de rejouer et réinterpréter chronologies d'événements depuis différentes perspectives et échelles temporelles.

#### Modes de Relecture Temporelle

**1. Échelle Humaine (Circadienne)**
```typescript
// Visualiser cycle vie projet à rythme circadien humain
visualiser.replay({
  start: projectStart,
  end: projectEnd,
  scale: "circadian", // Cycles 24 heures
  perspective: "human",
  focus: ["meetings", "decisions", "sleep"]
});
```

**2. Échelle Machine (Microsecondes)**
```typescript
// Visualiser chronologie décisions système à précision microseconde
visualiser.replay({
  start: incidentStart,
  end: incidentEnd,
  scale: "microsecond",
  perspective: "machine",
  focus: ["decisions", "state_changes", "errors"]
});
```

**3. Échelle Projet (Cycle de Vie)**
```typescript
// Visualiser cycle vie projet entier compressé en roue unique
visualiser.replay({
  start: projectStart,
  end: projectEnd,
  scale: "lifecycle", // Projet entier comme un cercle
  perspective: "project",
  focus: ["milestones", "team_rhythm", "decision_density"]
});
```

#### Archéologie Temporelle

Reconstruire le contexte complet de tout moment passé :

```typescript
// Quel était l'état temporel quand décision X a été prise ?
const context = visualiser.archaeology({
  moment: decisionTimestamp,
  radius: "24h", // Regarder 24h avant et après
  include: [
    "all_events",
    "team_state",
    "project_health",
    "external_factors",
    "circadian_state"
  ]
});
```

---

### 🎯 Maîtrise du Cycle de Vie Projet

**Chaque projet est une vie**—avec naissance, croissance, maturité et achèvement. Visualiser représente l'ADN temporel complet de cette vie.

#### ADN Temporel Projet

```typescript
type ProjectTemporalDNA = {
  // Naissance : Inception projet
  genesis: {
    timestamp: number;
    initiators: string[];
    initialContext: TemporalContext;
  };
  
  // Croissance : Phases développement
  phases: Array<{
    name: string;
    start: number;
    end: number;
    keyEvents: TemporalEvent[];
    teamRhythm: CircadianPattern;
    decisionDensity: number; // Décisions par jour
  }>;
  
  // Maturité : Opération stable
  maturity: {
    sustainedRhythm: CircadianPattern;
    maintenanceEvents: TemporalEvent[];
    evolutionRate: number; // Vélocité changement
  };
  
  // Achèvement : Clôture projet
  completion?: {
    timestamp: number;
    finalContext: TemporalContext;
    retrospective: TemporalAnalysis;
  };
  
  // Signes Vitaux : Santé projet dans le temps
  vitalSigns: {
    decisionQuality: TimeSeries;
    teamEnergy: TimeSeries;
    deliveryRhythm: TimeSeries;
    externalPressure: TimeSeries;
  };
};
```

#### Visualisation Cycle de Vie

Visualiser peut rendre le cycle vie projet entier comme :

1. **Cercle Compressé** : Projet entier comme roue 24 heures unique
2. **Timeline Étendue** : Vue multi-jour/semaine/mois défilable
3. **Comparaison Phases** : Superposer différentes phases projet
4. **Analyse Rythme Équipe** : Visualiser patterns circadiens équipe sur vie projet
5. **Archéologie Décisions** : Reconstruire contexte décisions critiques

---

### 🔒 Architecture Sécurité & Confidentialité

#### Modèle d'Authentification
- **Supabase Auth** avec fédération fournisseurs OAuth 2.0
- **Tokens JWT** avec cycles rafraîchissement automatiques
- **Coffre-fort tokens chiffré** dans Supabase avec application RLS
- **Zéro secrets côté client** — opérations sensibles dans edge functions
- **Authentification machine** via clés API avec permissions basées scope

#### Souveraineté Données
- **Row Level Security** appliqué sur toutes tables données
- **Isolation données utilisateur** au niveau requête base données
- **Immuabilité événements temporels** appliquée au niveau base données
- **Chiffrement bout-en-bout** (HTTPS/WSS uniquement)
- **Design privacy-first** — pas analytics ou tracking tiers

---

### 📄 Licence

Ce projet est sous licence **MIT** — voir fichier [LICENSE](LICENSE) pour détails.

---

### 📞 Support

- **Documentation** : [docs.dona.club](https://docs.dona.club)
- **Issues** : [GitHub Issues](https://github.com/votreusername/dona-club/issues)
- **Email** : support@dona.club
- **Discord** : [Rejoindre communauté](https://discord.gg/dona-club)

---

**Crafted with intention for mastering the lifecycle of every project**