# DONA.club — Visualiser

> **A temporal consciousness interface and chronological repository that enables multi-party observation of shared growth intentions, elevating project quality of life without constraint.**

[🇫🇷 Version française](#version-française) | [🇬🇧 English version](#english-version)

---

## English Version

### 🌅 The Vision

**Visualiser** is a temporal repository that makes time visible, queryable, and actionable across human and machine scales. It conserves chronological events with microsecond precision while rendering them as intuitive circular interfaces synchronized with natural rhythms.

The core insight: **every project is a life**. Birth, growth, maturity, completion. Visualiser captures this lifecycle as immutable temporal DNA—enabling teams, stakeholders, and systems to observe the same growth intention from their unique perspectives.

This is DONA.club's foundational tool for mastering project quality of life through temporal intelligence.

**What It Does:**

- **Temporal Repository**: Immutable event log with microsecond timestamps and full context preservation
- **Multi-Party Observation**: Same timeline viewed from human, machine, and stakeholder perspectives
- **Temporal Relativity**: Replay event sequences at different scales (circadian, microsecond, lifecycle)
- **Quality of Life Metrics**: Track project health through rhythm stability, energy levels, and delivery patterns
- **Elevation Without Constraint**: Integration that provides altitude without imposing structure

**Why It Matters:**

Projects fail not from lack of tools, but from temporal misalignment. Teams operate on different rhythms. Decisions lack historical context. Stakeholders see different realities. Machines optimize for wrong horizons.

Visualiser solves this by creating a shared temporal reference—a single source of truth that adapts to each observer's natural perspective while maintaining coherence across all views.

---

### 🧬 What Visualiser Represents

#### 🎯 For Humans: Circadian Consciousness
- **24-hour awareness wheel** with solar cycle markers (sunrise/sunset)
- **Living background gradients** that breathe with your biological state
- **Event arcs** revealing temporal density and proximity
- **Sleep architecture overlay** showing rest patterns and recovery debt/surplus
- **Temporal navigation** through intuitive gestures (scroll/swipe through time)
- **Personal perspective** on shared project timeline

#### 🤖 For Machines: Temporal Coordination Protocol
- **Chronological event repository** with microsecond precision indexing
- **Decision timeline reconstruction** for embedded systems and autonomous agents
- **Sliding horizon windows** for real-time temporal planning
- **Temporal relativity engine** for replaying event sequences at different scales
- **MCP-compatible interface** for high-level machine coordination
- **System perspective** on project evolution

#### 👥 For Teams: Shared Growth Observation
- **Multi-party temporal view**: Same project timeline observed from different roles
- **Stakeholder perspectives**: Product, engineering, design, leadership views
- **Temporal alignment**: Identify rhythm synchronization and misalignment
- **Collective memory**: Shared understanding of project history
- **Decision archaeology**: Reconstruct context of past choices with full team awareness

#### 🔄 Temporal Relativity & Replay
- **Event chronology conservation** with immutable temporal records
- **Multi-scale temporal replay**: View project lifecycles at day/week/month/year scales
- **Decision archaeology**: Reconstruct the temporal context of past decisions
- **Temporal pattern recognition**: Identify recurring rhythms and anomalies
- **Project lifecycle visualization**: See the complete temporal DNA of any project
- **Perspective switching**: View same timeline from different actor viewpoints

#### 🌐 Universal Time Streams
- **Human time streams**: Google, Microsoft, personal schedules
- **Machine time streams**: System logs, decision events, sensor data
- **Project time streams**: Milestones, deliverables, team activities
- **Natural time streams**: Solar cycles, seasonal patterns, circadian rhythms
- **Stakeholder time streams**: Client meetings, investor updates, partner coordination
- **Unified temporal view**: All streams merged into coherent temporal reality

---

### 🏛️ Architectural Philosophy

Visualiser is built on three foundational layers that enable **multi-party observation without constraint**:

#### 1. **Temporal Repository Layer**
The immutable chronological database that conserves all temporal events:

```typescript
type TemporalEvent = {
  id: string;
  timestamp: number; // Unix microseconds
  type: "human" | "machine" | "natural" | "project" | "stakeholder";
  source: string; // Origin stream (google, system, sensor, etc.)
  payload: any; // Event-specific data
  context: TemporalContext; // Full contextual snapshot
  metadata: {
    timezone: string;
    location?: { lat: number; lon: number };
    actor?: string; // Human or machine identifier
    role?: string; // Actor role in project (engineer, designer, PM, etc.)
    decision?: boolean; // Was this a decision point?
    visibility?: string[]; // Which parties can observe this event
  };
};
```

**Repository Capabilities:**
- **Immutable append-only log** of all temporal events
- **Microsecond precision** for machine coordination
- **Full context preservation** for temporal archaeology
- **Multi-stream indexing** for cross-temporal queries
- **Role-based visibility** for multi-party observation
- **Temporal relativity queries**: "Show me all events between T1 and T2 from perspective of actor X in role Y"

#### 2. **Consciousness Interface Layer**
The human-facing circular visualization that makes time intuitive:

- **Circadian-synchronized rendering** for biological alignment
- **Event arc visualization** for temporal density perception
- **Gestural temporal navigation** for intuitive time travel
- **Ambient information emergence** respecting attention as sacred
- **AI companion** with full temporal context awareness
- **Perspective selector**: Switch between personal, team, project, and stakeholder views
- **Elevation without constraint**: Interface adapts to user's need for detail vs. overview

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
  
  // Multi-party observation
  observeFromPerspective(perspective: ActorPerspective): TemporalView;
  
  // Project quality of life metrics
  assessProjectHealth(window: TimeWindow): ProjectHealthMetrics;
}
```

**Machine Use Cases:**
- **Embedded systems**: Log decision events with temporal context
- **Autonomous agents**: Query sliding horizon windows for planning
- **Distributed systems**: Synchronize temporal state across nodes
- **Temporal analytics**: Analyze decision patterns over project lifecycle
- **Predictive systems**: Learn from historical temporal patterns
- **Quality of life monitoring**: Track project health indicators over time

---

### 🌊 Temporal Relativity: The Core Innovation

Visualiser's most profound capability is **temporal relativity**—the ability to replay and reinterpret event chronologies from different perspectives and time scales, enabling **multi-party observation of shared growth**.

#### Temporal Replay Modes

**1. Human Scale (Circadian)**
```typescript
// View project lifecycle at human circadian rhythm
visualiser.replay({
  start: projectStart,
  end: projectEnd,
  scale: "circadian", // 24-hour cycles
  perspective: "human",
  actor: "engineer_alice",
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
  actor: "deployment_system",
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

**4. Stakeholder Scale (Strategic)**
```typescript
// View project from stakeholder perspective
visualiser.replay({
  start: quarterStart,
  end: quarterEnd,
  scale: "strategic", // Weekly/monthly rhythms
  perspective: "stakeholder",
  actor: "investor_board",
  focus: ["milestones", "risks", "opportunities", "team_health"]
});
```

#### Multi-Party Temporal Archaeology

Reconstruct the complete context of any past moment **from multiple perspectives**:

```typescript
// What was the temporal state when decision X was made?
// View from different actor perspectives
const contexts = visualiser.archaeology({
  moment: decisionTimestamp,
  radius: "24h", // Look 24h before and after
  perspectives: [
    { actor: "engineer_alice", role: "developer" },
    { actor: "designer_bob", role: "designer" },
    { actor: "pm_carol", role: "product_manager" },
    { actor: "deployment_system", role: "machine" }
  ],
  include: [
    "all_events",
    "team_state",
    "project_health",
    "external_factors",
    "circadian_state",
    "decision_context"
  ]
});

// Result: Same moment observed from 4 different perspectives
// Reveals how different actors experienced the same temporal reality
```

---

### 🎯 Project Quality of Life Mastery

**Every project is a life**—with birth, growth, maturity, and completion. Visualiser represents the complete temporal DNA of that life, enabling **elevation without constraint** for all participants.

#### Project Temporal DNA

```typescript
type ProjectTemporalDNA = {
  // Birth: Project inception
  genesis: {
    timestamp: number;
    initiators: string[];
    initialContext: TemporalContext;
    sharedIntention: string; // The growth intention all parties observe
  };
  
  // Growth: Development phases
  phases: Array<{
    name: string;
    start: number;
    end: number;
    keyEvents: TemporalEvent[];
    teamRhythm: CircadianPattern;
    decisionDensity: number; // Decisions per day
    qualityOfLife: number; // 0-100 health score
    participantPerspectives: Map<string, ActorPerspective>;
  }>;
  
  // Maturity: Stable operation
  maturity: {
    sustainedRhythm: CircadianPattern;
    maintenanceEvents: TemporalEvent[];
    evolutionRate: number; // Change velocity
    stabilityScore: number; // 0-100
  };
  
  // Completion: Project closure
  completion?: {
    timestamp: number;
    finalContext: TemporalContext;
    retrospective: TemporalAnalysis;
    participantReflections: Map<string, Reflection>;
  };
  
  // Vital Signs: Project health over time
  vitalSigns: {
    decisionQuality: TimeSeries;
    teamEnergy: TimeSeries;
    deliveryRhythm: TimeSeries;
    externalPressure: TimeSeries;
    qualityOfLife: TimeSeries; // Overall project health
    participantSatisfaction: Map<string, TimeSeries>;
  };
  
  // Multi-Party Observation
  observationLog: Array<{
    timestamp: number;
    observer: string;
    perspective: ActorPerspective;
    insights: string[];
  }>;
};
```

#### Quality of Life Metrics

Visualiser tracks **project quality of life** through multiple dimensions:

```typescript
type ProjectHealthMetrics = {
  // Temporal health
  rhythmStability: number; // 0-100: Consistency of team rhythms
  decisionVelocity: number; // Decisions per day
  temporalAlignment: number; // 0-100: How synchronized are team members
  
  // Energy health
  teamEnergy: number; // 0-100: Collective energy level
  burnoutRisk: number; // 0-100: Risk of team exhaustion
  recoveryBalance: number; // Sleep debt/capital across team
  
  // Delivery health
  milestoneProgress: number; // 0-100: On-track percentage
  deliveryRhythm: number; // Consistency of deliveries
  qualityTrend: number; // Improving/declining quality
  
  // Stakeholder health
  alignmentScore: number; // 0-100: Stakeholder alignment
  communicationFrequency: number; // Meetings per week
  satisfactionTrend: number; // Improving/declining satisfaction
  
  // Overall quality of life
  overallHealth: number; // 0-100: Composite score
  elevationPotential: number; // 0-100: Capacity for growth without constraint
};
```

#### Elevation Without Constraint

Visualiser's integration philosophy:

1. **Non-Invasive Observation**: Temporal data collection happens naturally through existing workflows
2. **Adaptive Granularity**: Interface shows detail when needed, overview when desired
3. **Perspective Freedom**: Each actor observes from their natural viewpoint
4. **No Forced Synchronization**: Respects different rhythms and working styles
5. **Emergent Insights**: Patterns surface naturally without imposed structure
6. **Quality of Life First**: All features designed to reduce friction, not add it

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
- **Role-based access control** for multi-party observation
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
  event_type TEXT NOT NULL, -- 'human', 'machine', 'natural', 'project', 'stakeholder'
  source TEXT NOT NULL, -- Origin stream identifier
  actor TEXT, -- Human or machine identifier
  actor_role TEXT, -- Role in project (engineer, designer, PM, etc.)
  payload JSONB NOT NULL, -- Event-specific data
  context JSONB NOT NULL, -- Full temporal context snapshot
  metadata JSONB, -- Additional metadata
  is_decision BOOLEAN DEFAULT false,
  visibility TEXT[], -- Which parties can observe this event
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for temporal queries
CREATE INDEX idx_temporal_events_timestamp ON temporal_events(timestamp);
CREATE INDEX idx_temporal_events_type ON temporal_events(event_type);
CREATE INDEX idx_temporal_events_source ON temporal_events(source);
CREATE INDEX idx_temporal_events_actor ON temporal_events(actor);
CREATE INDEX idx_temporal_events_role ON temporal_events(actor_role);

-- Project lifecycle tracking
CREATE TABLE project_lifecycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT UNIQUE NOT NULL,
  genesis_timestamp BIGINT NOT NULL,
  completion_timestamp BIGINT,
  shared_intention TEXT NOT NULL, -- The growth intention
  temporal_dna JSONB NOT NULL, -- Complete project temporal DNA
  quality_of_life_metrics JSONB, -- Health metrics over time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-party observation log
CREATE TABLE observation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES project_lifecycles(project_id),
  timestamp BIGINT NOT NULL,
  observer TEXT NOT NULL,
  observer_role TEXT NOT NULL,
  perspective JSONB NOT NULL, -- Actor perspective data
  insights TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
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
- Role-based access control for multi-party observation
- Service role for administrative operations only
- Temporal event immutability enforced at database level

#### Serverless Functions

**`chatkit-session`** — Initializes AI companion with full temporal context
```typescript
POST /functions/v1/chatkit-session
Body: { deviceId, pageContext, actorRole }
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
Body: { messages, stream, thread_id, actorPerspective }
Returns: Server-Sent Events stream
```

**`temporal-query`** — Query temporal repository (MCP interface)
```typescript
POST /functions/v1/temporal-query
Body: { start, end, filters, perspective, actorRole }
Returns: { events: TemporalEvent[], patterns: TemporalPattern[] }
```

**`temporal-replay`** — Replay event sequence at different scale
```typescript
POST /functions/v1/temporal-replay
Body: { start, end, scale, perspective, focus, actorRole }
Returns: { sequence: EventSequence, analysis: TemporalAnalysis }
```

**`project-health`** — Assess project quality of life
```typescript
POST /functions/v1/project-health
Body: { projectId, window, perspective }
Returns: { metrics: ProjectHealthMetrics, insights: string[] }
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
  
  // Multi-party features
  multiPartyObservation: true,
  perspectiveSwitching: true,
  qualityOfLifeMetrics: true,
  stakeholderViews: true,
  
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
  
  // Actor perspective
  actor: {
    id: string;
    role: string; // engineer, designer, PM, stakeholder, machine
    perspective: ActorPerspective;
  };
  
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
    qualityOfLife: ProjectHealthMetrics;
    sharedIntention: string;
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
- **Role-based access control** for multi-party observation

#### Data Sovereignty
- **Row Level Security** enforced on all data tables
- **User data isolation** at database query level
- **Temporal event immutability** enforced at database level
- **Role-based visibility** for multi-party observation
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
- [ ] Multi-party observation with perspective switching
- [ ] Quality of life metrics calculation

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
- Multi-party observation support

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

**Visualiser** est un référentiel temporel qui rend le temps visible, interrogeable et actionnable à travers les échelles humaines et machines. Il conserve les événements chronologiques avec une précision microseconde tout en les rendant sous forme d'interfaces circulaires intuitives synchronisées avec les rythmes naturels.

L'insight central : **chaque projet est une vie**. Naissance, croissance, maturité, achèvement. Visualiser capture ce cycle de vie comme ADN temporel immuable—permettant aux équipes, parties prenantes et systèmes d'observer la même intention de croissance depuis leurs perspectives uniques.

C'est l'outil fondateur de DONA.club pour maîtriser la qualité de vie des projets à travers l'intelligence temporelle.

**Ce Qu'il Fait :**

- **Référentiel Temporel** : Log d'événements immuable avec timestamps microseconde et préservation contexte complet
- **Observation Multipartite** : Même chronologie vue depuis perspectives humaine, machine et parties prenantes
- **Relativité Temporelle** : Rejouer séquences événements à différentes échelles (circadienne, microseconde, lifecycle)
- **Métriques Qualité de Vie** : Suivre santé projet via stabilité rythmes, niveaux énergie et patterns livraison
- **Élévation Sans Contrainte** : Intégration qui fournit altitude sans imposer structure

**Pourquoi C'est Important :**

Les projets échouent non par manque d'outils, mais par désalignement temporel. Les équipes opèrent sur différents rythmes. Les décisions manquent de contexte historique. Les parties prenantes voient différentes réalités. Les machines optimisent pour mauvais horizons.

Visualiser résout ceci en créant une référence temporelle partagée—une source unique de vérité qui s'adapte à la perspective naturelle de chaque observateur tout en maintenant cohérence à travers toutes les vues.

---

### 🔒 Architecture Sécurité & Confidentialité

#### Modèle d'Authentification
- **Supabase Auth** avec fédération fournisseurs OAuth 2.0
- **Tokens JWT** avec cycles rafraîchissement automatiques
- **Coffre-fort tokens chiffré** dans Supabase avec application RLS
- **Zéro secrets côté client** — opérations sensibles dans edge functions
- **Authentification machine** via clés API avec permissions basées scope
- **Contrôle d'accès basé rôles** pour observation multipartite

#### Souveraineté Données
- **Row Level Security** appliqué sur toutes tables données
- **Isolation données utilisateur** au niveau requête base données
- **Immuabilité événements temporels** appliquée au niveau base données
- **Visibilité basée rôles** pour observation multipartite
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

**Built for clarity, designed for elevation**