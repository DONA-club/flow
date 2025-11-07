# DONA.club — Visualiser

> **A temporal consciousness interface and chronological repository that enables multi-party observation of shared growth intentions, elevating project quality of life without constraint.**

[🇫🇷 Version française](#version-française) | [🇬🇧 English version](#english-version)

---

## English Version

### 🌅 The Vision

**Visualiser** is not a calendar—it's a **temporal repository and consciousness instrument** that reveals the invisible architecture of time itself. By rendering temporal flows as living, breathing circles synchronized with natural and project rhythms, Visualiser enables **multi-party observation of a shared growth intention**—allowing teams, stakeholders, and systems to perceive the same temporal reality from their unique perspectives.

This is the foundational manifestation of **DONA.club's broader ambition**: to master quality of life across projects, organizations, and individuals through temporal intelligence. **Every project is a life**—and Visualiser is the heart of mastering that life, providing **elevation without constraint** for all participants.

**Core Principles:**

- **Multi-Party Temporal Observation**: Multiple actors (humans, machines, stakeholders) observe the same growth intention from different perspectives
- **Elevation Without Constraint**: Integration contributes to gaining altitude and perspective without imposing rigid structures
- **Project Quality of Life Mastery**: The temporal repository becomes the living memory of project health and evolution
- **Temporal Repository**: Conserves and indexes chronological events for retrospective analysis and temporal relativity
- **Multi-Scale Consciousness**: Operates from human circadian rhythms to machine decision horizons (embedded systems, sliding windows)
- **Temporal Relativity**: Enables replay and reinterpretation of event chronologies across different time scales and perspectives

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

**Visualiser** n'est pas un calendrier—c'est un **référentiel temporel et instrument de conscience** qui révèle l'architecture invisible du temps lui-même. En représentant les flux temporels comme des cercles vivants, synchronisés avec les rythmes naturels et projets, Visualiser permet **l'observation multipartite d'une intention de croissance partagée**—permettant aux équipes, parties prenantes et systèmes de percevoir la même réalité temporelle depuis leurs perspectives uniques.

C'est la manifestation fondatrice de **l'ambition plus large de DONA.club** : maîtriser la qualité de vie des projets, organisations et individus à travers l'intelligence temporelle. **Chaque projet est une vie**—et Visualiser est le cœur de la maîtrise de cette vie, fournissant **l'élévation sans contrainte** pour tous les participants.

**Principes Fondamentaux :**

- **Observation Temporelle Multipartite** : Multiples acteurs (humains, machines, parties prenantes) observent la même intention de croissance depuis différentes perspectives
- **Élévation Sans Contrainte** : L'intégration contribue à la prise de hauteur et à l'élévation sans imposer de structures rigides
- **Maîtrise Qualité de Vie Projet** : Le référentiel temporel devient la mémoire vivante de la santé et évolution du projet
- **Référentiel Temporel** : Conserve et indexe les événements chronologiques pour analyse rétrospective et relativité temporelle
- **Conscience Multi-Échelle** : Opère des rythmes circadiens humains aux horizons de décision machine (systèmes embarqués, fenêtres glissantes)
- **Relativité Temporelle** : Permet la relecture et réinterprétation des chronologies d'événements à différentes échelles et perspectives

---

### 🧬 Ce que Représente Visualiser

#### 🎯 Pour les Humains : Conscience Circadienne
- **Roue de conscience 24 heures** avec marqueurs de cycle solaire (lever/coucher)
- **Dégradés d'arrière-plan vivants** qui respirent avec votre état biologique
- **Arcs d'événements** révélant densité et proximité temporelles
- **Superposition d'architecture du sommeil** montrant patterns de repos et dette/surplus de récupération
- **Navigation temporelle** par gestes intuitifs (défilement/balayage dans le temps)
- **Perspective personnelle** sur la chronologie projet partagée

#### 🤖 Pour les Machines : Protocole de Coordination Temporelle
- **Référentiel d'événements chronologiques** avec indexation précision microseconde
- **Reconstruction de chronologie de décisions** pour systèmes embarqués et agents autonomes
- **Fenêtres d'horizon glissant** pour planification temporelle temps réel
- **Moteur de relativité temporelle** pour rejouer séquences d'événements à différentes échelles
- **Interface compatible MCP** pour coordination machine haut niveau
- **Perspective système** sur l'évolution projet

#### 👥 Pour les Équipes : Observation Croissance Partagée
- **Vue temporelle multipartite** : Même chronologie projet observée depuis différents rôles
- **Perspectives parties prenantes** : Vues produit, ingénierie, design, direction
- **Alignement temporel** : Identifier synchronisation et désalignement des rythmes
- **Mémoire collective** : Compréhension partagée de l'histoire projet
- **Archéologie décisions** : Reconstruire contexte choix passés avec conscience équipe complète

#### 🔄 Relativité Temporelle & Relecture
- **Conservation de chronologie d'événements** avec enregistrements temporels immuables
- **Relecture temporelle multi-échelle** : Visualiser cycles de vie projet à échelles jour/semaine/mois/année
- **Archéologie de décisions** : Reconstruire le contexte temporel de décisions passées
- **Reconnaissance de patterns temporels** : Identifier rythmes récurrents et anomalies
- **Visualisation cycle de vie projet** : Voir l'ADN temporel complet de tout projet
- **Changement de perspective** : Voir même chronologie depuis différents points de vue acteurs

#### 🌐 Flux Temporels Universels
- **Flux temporels humains** : Google, Microsoft, agendas personnels
- **Flux temporels machine** : Logs système, événements de décision, données capteurs
- **Flux temporels projet** : Jalons, livrables, activités équipe
- **Flux temporels naturels** : Cycles solaires, patterns saisonniers, rythmes circadiens
- **Flux temporels parties prenantes** : Réunions clients, mises à jour investisseurs, coordination partenaires
- **Vue temporelle unifiée** : Tous flux fusionnés en réalité temporelle cohérente

---

### 🎯 Maîtrise Qualité de Vie Projet

**Chaque projet est une vie**—avec naissance, croissance, maturité et achèvement. Visualiser représente l'ADN temporel complet de cette vie, permettant **l'élévation sans contrainte** pour tous les participants.

#### Métriques Qualité de Vie

Visualiser suit la **qualité de vie du projet** à travers multiples dimensions :

```typescript
type ProjectHealthMetrics = {
  // Santé temporelle
  rhythmStability: number; // 0-100: Consistance des rythmes équipe
  decisionVelocity: number; // Décisions par jour
  temporalAlignment: number; // 0-100: Synchronisation membres équipe
  
  // Santé énergétique
  teamEnergy: number; // 0-100: Niveau énergie collective
  burnoutRisk: number; // 0-100: Risque épuisement équipe
  recoveryBalance: number; // Dette/capital sommeil équipe
  
  // Santé livraison
  milestoneProgress: number; // 0-100: Pourcentage sur la bonne voie
  deliveryRhythm: number; // Consistance des livraisons
  qualityTrend: number; // Tendance qualité amélioration/déclin
  
  // Santé parties prenantes
  alignmentScore: number; // 0-100: Alignement parties prenantes
  communicationFrequency: number; // Réunions par semaine
  satisfactionTrend: number; // Tendance satisfaction amélioration/déclin
  
  // Qualité de vie globale
  overallHealth: number; // 0-100: Score composite
  elevationPotential: number; // 0-100: Capacité croissance sans contrainte
};
```

#### Élévation Sans Contrainte

Philosophie d'intégration de Visualiser :

1. **Observation Non-Invasive** : Collecte données temporelles naturellement via workflows existants
2. **Granularité Adaptive** : Interface montre détail quand nécessaire, vue d'ensemble quand désiré
3. **Liberté de Perspective** : Chaque acteur observe depuis son point de vue naturel
4. **Pas de Synchronisation Forcée** : Respecte différents rythmes et styles de travail
5. **Insights Émergents** : Patterns émergent naturellement sans structure imposée
6. **Qualité de Vie Prioritaire** : Toutes fonctionnalités conçues pour réduire friction, pas l'ajouter

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

**Crafted with intention for elevation without constraint**