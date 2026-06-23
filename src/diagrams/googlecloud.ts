import { type DiagramDef, cnode, edge } from './types'

// Google Cloud reference architectures — the AWS set mapped onto Google Cloud services.
//
// ClickPipes ingestion: streaming sources (Pub/Sub, Managed Service for Apache Kafka), object
// storage (GCS), and Postgres/MySQL CDC (Cloud SQL / AlloyDB) are ingested directly by ClickPipes.
// Dataflow / Cloud Run functions are used when in-stream processing is needed before ingest and
// write directly to ClickHouse. (The observability diagram still routes Pub/Sub via Dataflow to
// show that processing option.)

// ---------------------------------------------------------------------------------------------
// 1) Real-time analytics
// ---------------------------------------------------------------------------------------------
const R = { SRC: 150, ING: 470, PROC: 790, PIPES: 1075, CH: 1300, VIZ: 1620 }

export const gcpRealtime: DiagramDef = {
  id: 'gcp-real-time',
  title: 'Real-time Analytics',
  description:
    'Events flow through Pub/Sub and Managed Service for Apache Kafka. Both are ingested directly by ClickPipes into ClickHouse, where incremental materialized views power live dashboards and APIs; when in-stream processing is needed, Pub/Sub can instead go through Dataflow or Cloud Run functions. Cloud SQL is captured by ClickPipes CDC.',
  stages: [
    { title: 'Data Sources', x: R.SRC },
    { title: 'Stream Ingestion', x: R.ING },
    { title: 'Stream Processing', x: R.PROC },
    { title: 'Realtime Data Warehouse', x: (R.PIPES + R.CH) / 2 },
    { title: 'Visualization & APIs', x: R.VIZ },
  ],
  nodes: [
    cnode('apps', R.SRC, 160, { label: 'Web & Mobile Apps', sub: 'Clickstream / events', category: 'source', icon: 'apps' }),
    cnode('apigateway', R.SRC, 300, { label: 'API Gateway', sub: 'Event APIs', category: 'source', icon: 'apigee' }),
    cnode('gke', R.SRC, 440, { label: 'GKE / Cloud Run', sub: 'Application services', category: 'source', icon: 'gke' }),
    cnode('cloudsql', R.SRC, 580, { label: 'Cloud SQL', sub: 'Postgres / MySQL', category: 'source', icon: 'cloudsql' }),

    cnode('pubsub', R.ING, 250, { label: 'Pub/Sub', sub: 'Global messaging', category: 'ingest', icon: 'pubsub' }),
    cnode('kafka', R.ING, 430, { label: 'Managed Kafka', sub: 'Apache Kafka', category: 'ingest', icon: 'kafka' }),

    cnode('dataflow', R.PROC, 250, { label: 'Dataflow', sub: 'Stream processing (Beam)', category: 'ingest', icon: 'dataflow' }),
    cnode('functions', R.PROC, 470, { label: 'Cloud Run functions', sub: 'Lightweight transforms', category: 'ingest', icon: 'cloudfunctions' }),

    cnode('clickpipes', R.PIPES, 380, { label: 'ClickPipes', sub: 'Managed ingestion', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', R.CH, 365, { label: 'ClickHouse Cloud', sub: 'Real-time analytics', category: 'clickhouse', icon: 'clickhouse', badge: 'Materialized Views', hero: true }),

    cnode('looker', R.VIZ, 170, { label: 'Looker', sub: 'Live dashboards', category: 'consume', icon: 'looker' }),
    cnode('grafana', R.VIZ, 320, { label: 'Grafana', sub: 'Real-time monitoring', category: 'consume', icon: 'grafana' }),
    cnode('superset', R.VIZ, 470, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('apis', R.VIZ, 620, { label: 'Application APIs', sub: 'Customer-facing analytics', category: 'consume', icon: 'apps' }),
  ],
  edges: [
    edge('apps', 'pubsub'),
    edge('apigateway', 'pubsub'),
    edge('gke', 'kafka'),
    // Managed Kafka is a ClickPipes source -> ClickPipes -> ClickHouse
    edge('kafka', 'clickpipes'),
    edge('clickpipes', 'clickhouse'),
    // Cloud SQL (Postgres / MySQL) is a ClickPipes CDC source -> ClickPipes (direct)
    edge('cloudsql', 'clickpipes', { label: 'Postgres / MySQL CDC' }, { targetHandle: 'b' }),
    // Pub/Sub ingested directly by ClickPipes -> ClickHouse (no stream-processing hop needed)
    edge('pubsub', 'clickpipes', { label: 'Pub/Sub' }),
    // Or processed in-stream first: Dataflow / Cloud Run functions write directly to ClickHouse
    edge('pubsub', 'dataflow', { variant: 'optional' }),
    edge('dataflow', 'clickhouse', { variant: 'optional', label: 'ClickHouse sink' }, { targetHandle: 't' }),
    edge('pubsub', 'functions', { variant: 'optional' }),
    edge('functions', 'clickhouse', { variant: 'optional', label: 'Direct insert' }, { targetHandle: 'b' }),
    // ClickHouse -> Visualization & APIs
    edge('clickhouse', 'looker'),
    edge('clickhouse', 'grafana'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'apis'),
  ],
}

// ---------------------------------------------------------------------------------------------
// 2) Data warehouse
// ---------------------------------------------------------------------------------------------
const W = { SRC: 150, ETL: 470, LAKE: 790, PIPES: 1075, CH: 1300, BI: 1620 }

export const gcpWarehouse: DiagramDef = {
  id: 'gcp-warehouse',
  title: 'Data Warehouse',
  description:
    'Cloud SQL is captured by ClickPipes CDC (Postgres GA, MySQL beta) and AlloyDB via the Postgres-compatible connector; SaaS lands in a GCS Iceberg lake via Data Fusion / Dataflow, and Bigtable reaches the lake through Dataflow. ClickPipes ingests files into native MergeTree, while ClickHouse separately queries the lake in place via the Google Lakehouse (BigLake / Dataplex) Iceberg REST catalog — read-only, beta in 26.2 — serving BI and ad-hoc SQL.',
  stages: [
    { title: 'Data Sources', x: W.SRC },
    { title: 'Ingestion & ETL', x: W.ETL },
    { title: 'Data Lake', x: W.LAKE },
    { title: 'Realtime Data Warehouse', x: (W.PIPES + W.CH) / 2 },
    { title: 'BI & Analytics', x: W.BI },
  ],
  nodes: [
    cnode('cloudsql', W.SRC, 160, { label: 'Cloud SQL', sub: 'Relational databases', category: 'source', icon: 'cloudsql' }),
    cnode('alloydb', W.SRC, 300, { label: 'AlloyDB', sub: 'Postgres-compatible OLTP', category: 'source', icon: 'alloydb' }),
    cnode('bigtable', W.SRC, 440, { label: 'Bigtable', sub: 'NoSQL', category: 'source', icon: 'bigtable' }),
    cnode('apps', W.SRC, 580, { label: 'SaaS & Apps', sub: 'External sources', category: 'source', icon: 'apps' }),

    cnode('dataflow', W.ETL, 300, { label: 'Dataflow', sub: 'Batch ETL', category: 'ingest', icon: 'dataflow' }),
    cnode('datafusion', W.ETL, 470, { label: 'Cloud Data Fusion', sub: 'SaaS connectors', category: 'ingest', icon: 'datafusion' }),

    cnode('gcs', W.LAKE, 280, { label: 'Cloud Storage', sub: 'Iceberg data lake', category: 'ingest', icon: 'gcs' }),
    cnode('catalog', W.LAKE, 450, { label: 'Lakehouse Catalog', sub: 'BigLake / Dataplex · Iceberg REST', category: 'ingest', icon: 'dataplex' }),

    cnode('clickpipes', W.PIPES, 365, { label: 'ClickPipes', sub: 'CDC + files → MergeTree', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', W.CH, 350, { label: 'ClickHouse Cloud', sub: 'Cloud data warehouse', category: 'clickhouse', icon: 'clickhouse', badge: 'MergeTree + Iceberg query', hero: true }),

    cnode('looker', W.BI, 170, { label: 'Looker', sub: 'BI dashboards', category: 'consume', icon: 'looker' }),
    cnode('bi', W.BI, 320, { label: 'Tableau / Looker Studio', sub: 'BI tools', category: 'consume', icon: 'bi' }),
    cnode('superset', W.BI, 470, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('sql', W.BI, 620, { label: 'SQL Clients', sub: 'Ad-hoc analytics', category: 'consume', icon: 'sql' }),
  ],
  edges: [
    // Cloud SQL captured by ClickPipes CDC (Postgres GA; MySQL in beta). AlloyDB works via the
    // Postgres CDC connector (Postgres-compatible) though it isn't a separately named source.
    edge('cloudsql', 'clickpipes', { label: 'Postgres CDC · MySQL (beta)' }, { targetHandle: 't' }),
    edge('alloydb', 'clickpipes', { label: 'Postgres-compatible CDC' }, { targetHandle: 't' }),
    // SaaS / apps -> ETL
    edge('apps', 'datafusion'),
    edge('apps', 'dataflow', { variant: 'optional' }),
    // Bigtable has no native Iceberg export — route through Dataflow (or BigQuery) into the GCS lake
    edge('bigtable', 'dataflow', { label: 'Dataflow → Iceberg' }, { sourceHandle: 'r', targetHandle: 'b' }),
    // Ingestion -> Data Lake
    edge('dataflow', 'gcs'),
    edge('datafusion', 'gcs'),
    edge('gcs', 'catalog', { label: 'Register' }),
    // ClickPipes ingests files into native MergeTree; ClickHouse separately queries Iceberg in place
    // via the Google Lakehouse (BigLake/Dataplex) Iceberg REST catalog — read-only, beta in 26.2.
    edge('gcs', 'clickpipes', { label: 'Files → MergeTree' }),
    edge('clickpipes', 'clickhouse'),
    edge('catalog', 'clickhouse', { color: '#5BD6E3', label: 'Iceberg REST · read-only (beta)' }),
    // ClickHouse -> BI
    edge('clickhouse', 'looker'),
    edge('clickhouse', 'bi'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'sql'),
  ],
}

// ---------------------------------------------------------------------------------------------
// 3) Observability
// ---------------------------------------------------------------------------------------------
const O = { SRC: 150, COL: 470, STR: 790, PIPES: 1075, CH: 1300, VIZ: 1620, ALERT: 1860 }

export const gcpObservability: DiagramDef = {
  id: 'gcp-observability',
  title: 'Observability',
  description:
    'Fluent Bit, OpenTelemetry, and Vector collect logs/metrics/traces from GKE, Compute Engine, and Cloud Run. Kafka buffers into ClickPipes; Pub/Sub is processed by Dataflow into ClickHouse; Vector and the native OTLP endpoint write directly; and GCS log-sink archives are pulled by ClickPipes. All land in ClickHouse (ClickStack) for Grafana / Looker Studio / Superset / HyperDX with Pub/Sub alerting.',
  stages: [
    { title: 'Data Sources', x: O.SRC },
    { title: 'Collection & Routing', x: O.COL },
    { title: 'Streaming', x: O.STR },
    { title: 'Realtime Data Warehouse', x: (O.PIPES + O.CH) / 2 },
    { title: 'Visualization & Alerting', x: (O.VIZ + O.ALERT) / 2 },
  ],
  nodes: [
    cnode('apps', O.SRC, 110, { label: 'Applications', sub: 'Services & APIs', category: 'source', icon: 'apps' }),
    cnode('gce', O.SRC, 250, { label: 'Compute Engine', sub: 'VM instances', category: 'source', icon: 'gce' }),
    cnode('gke', O.SRC, 390, { label: 'GKE', sub: 'Containers', category: 'source', icon: 'gke' }),
    cnode('cloudrun', O.SRC, 530, { label: 'Cloud Run', sub: 'Services & jobs', category: 'source', icon: 'cloudrun' }),
    cnode('cloudops', O.SRC, 670, { label: 'Cloud Logging', sub: 'Logs & metrics', category: 'source', icon: 'cloudmonitoring' }),
    cnode('auditlogs', O.SRC, 800, { label: 'Audit & VPC Logs', sub: 'Log-sink archive', category: 'source', icon: 'cloudmonitoring' }),

    cnode('fluentbit', O.COL, 110, { label: 'Fluent Bit', sub: 'Log forwarder', category: 'ingest', icon: 'fluentbit' }),
    cnode('vector', O.COL, 250, { label: 'Vector', sub: 'Observability pipeline', category: 'ingest', icon: 'vector' }),
    cnode('otel', O.COL, 440, { label: 'OpenTelemetry', sub: 'Collector', category: 'ingest', icon: 'otel', badge: 'ClickStack', clickstack: true }),
    cnode('gcs', O.COL, 760, { label: 'Cloud Storage', sub: 'Log archive', category: 'ingest', icon: 'gcs' }),

    cnode('pubsub', O.STR, 250, { label: 'Pub/Sub', sub: 'Global messaging', category: 'ingest', icon: 'pubsub' }),
    cnode('kafka', O.STR, 410, { label: 'Managed Kafka', sub: 'Apache Kafka', category: 'ingest', icon: 'kafka' }),
    cnode('dataflow', O.STR, 570, { label: 'Dataflow', sub: 'Stream processing', category: 'ingest', icon: 'dataflow' }),

    cnode('clickpipes', O.PIPES, 410, { label: 'ClickPipes', sub: 'Managed ingestion', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', O.CH, 395, { label: 'ClickHouse Cloud', sub: 'Logs · Metrics · Traces', category: 'clickhouse', icon: 'clickhouse', badge: 'ClickStack', hero: true, clickstack: true }),

    cnode('grafana', O.VIZ, 190, { label: 'Grafana', sub: 'Dashboards', category: 'consume', icon: 'grafana' }),
    cnode('pubsubalert', O.ALERT, 190, { label: 'Pub/Sub', sub: 'Notifications', category: 'consume', icon: 'pubsub' }),
    cnode('looker', O.VIZ, 340, { label: 'Looker Studio', sub: 'Reporting', category: 'consume', icon: 'looker' }),
    cnode('superset', O.VIZ, 490, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('hyperdx', O.VIZ, 640, { label: 'HyperDX', sub: 'Unified observability', category: 'consume', icon: 'hyperdx', badge: 'ClickStack', clickstack: true }),
  ],
  edges: [
    edge('apps', 'fluentbit'),
    edge('gce', 'vector'),
    edge('gke', 'otel'),
    edge('cloudrun', 'otel'),
    // Audit / VPC logs sink to GCS -> ClickPipes
    edge('auditlogs', 'gcs', { label: 'Log sink' }),
    // Fluent Bit & OTel buffer through the streaming layer
    edge('fluentbit', 'kafka'),
    edge('otel', 'kafka'),
    edge('otel', 'pubsub'),
    edge('cloudops', 'pubsub', { label: 'Log router' }),
    // Vector writes directly to ClickHouse via its native sink
    edge('vector', 'clickhouse', { color: '#22C7BE', label: 'ClickHouse sink' }, { targetHandle: 't' }),
    // Managed Kafka is a ClickPipes source; GCS archive is a ClickPipes object-storage source
    edge('kafka', 'clickpipes'),
    edge('gcs', 'clickpipes', { label: 'Object storage' }, { targetHandle: 'b' }),
    edge('clickpipes', 'clickhouse'),
    // Pub/Sub is NOT a ClickPipes source — Dataflow processes it and writes directly
    edge('pubsub', 'dataflow'),
    edge('dataflow', 'clickhouse', { label: 'Direct insert' }, { targetHandle: 'b' }),
    // OTel native OTLP endpoint writes straight to ClickHouse
    edge('otel', 'clickhouse', { variant: 'optional', color: '#5B9BFF', label: 'Native OTLP' }, { targetHandle: 't' }),
    // ClickHouse -> Visualization
    edge('clickhouse', 'grafana'),
    edge('clickhouse', 'looker'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'hyperdx'),
    // Alerting — Grafana has no native Pub/Sub contact point; a webhook hits a Cloud Run/Functions
    // endpoint that publishes to Pub/Sub. Labeled as a webhook so it doesn't read as built-in.
    edge('grafana', 'pubsubalert', { variant: 'optional', color: '#FF7AB6', label: 'Webhook → Pub/Sub' }),
  ],
}

// ---------------------------------------------------------------------------------------------
// 4) Machine Learning / Gen AI
// ---------------------------------------------------------------------------------------------
const M = { APP: 160, FM: 480, TOOLS: 800, CH: 1140 }

export const gcpMlGenai: DiagramDef = {
  id: 'gcp-ml-genai',
  title: 'Machine Learning / Gen AI',
  description:
    "LibreChat runs its own agent framework: it calls Vertex AI foundation models (Gemini, guarded by Vertex AI safety) and uses MCP tools including the ClickHouse MCP server, with tracing to Langfuse. RAG is indexed event-driven (GCS event → Cloud Run function → Vertex AI embeddings → ClickHouse). ClickHouse is the shared vector store, analytics tool, and observability backend.",
  stages: [
    { title: 'Applications & Data', x: M.APP },
    { title: 'Foundation Models', x: M.FM },
    { title: 'Agent Tools', x: M.TOOLS },
    { title: 'Knowledge & Observability', x: M.CH },
  ],
  nodes: [
    cnode('librechat', M.APP, 300, { label: 'LibreChat', sub: 'Chat app + agent framework', category: 'source', icon: 'librechat' }),
    cnode('gcs', M.APP, 600, { label: 'Cloud Storage', sub: 'Document corpus', category: 'source', icon: 'gcs' }),

    cnode('vertexfm', M.FM, 160, { label: 'Vertex AI', sub: 'Gemini foundation models', category: 'agent', icon: 'vertexai' }),
    cnode('guardrails', M.FM, 310, { label: 'Vertex AI Safety', sub: 'Guardrails & policy', category: 'agent', icon: 'guardrails' }),
    cnode('ingest', M.FM, 600, { label: 'Cloud Run function', sub: 'Embedding pipeline', category: 'ingest', icon: 'cloudfunctions' }),

    cnode('chmcp', M.TOOLS, 160, { label: 'ClickHouse MCP', sub: 'Agent tool', category: 'ingest', icon: 'clickhouse' }),
    cnode('functions', M.TOOLS, 310, { label: 'Cloud Run functions', sub: 'Actions / tools', category: 'ingest', icon: 'cloudfunctions' }),
    cnode('embed', M.TOOLS, 600, { label: 'Vertex AI', sub: 'Embeddings model', category: 'ingest', icon: 'vertexai' }),

    cnode('clickhouse', M.CH, 340, { label: 'ClickHouse Cloud', sub: 'Vector store + observability', category: 'clickhouse', icon: 'clickhouse', badge: 'Vector Search', hero: true }),
    cnode('langfuse', M.CH, 630, { label: 'Langfuse', sub: 'LLM & agent observability', category: 'consume', icon: 'langfuse', badge: 'Powered by ClickHouse' }),
  ],
  edges: [
    // Native LibreChat path: its agent framework calls Vertex AI FMs (guarded) + MCP tools
    edge('librechat', 'vertexfm', { label: 'Foundation models' }),
    edge('vertexfm', 'guardrails', { label: 'Safety' }, { sourceHandle: 'sb', targetHandle: 't' }),
    edge('librechat', 'chmcp', { label: 'MCP tool' }),
    edge('librechat', 'functions', { label: 'Actions' }),
    edge('chmcp', 'clickhouse', { label: 'Vector search · analytics' }),
    // Event-driven RAG indexing: GCS event -> Cloud Run function -> Vertex AI embeddings -> ClickHouse
    edge('gcs', 'ingest', { label: 'GCS event (Eventarc)' }),
    edge('ingest', 'embed', { label: 'Chunk + embed' }),
    edge('embed', 'clickhouse', { label: 'Vectors' }),
    // Observability — LibreChat traces every message to Langfuse (stored in ClickHouse)
    edge('librechat', 'langfuse', { color: '#34D399', label: 'Traces' }, { sourceHandle: 'sb', targetHandle: 'l' }),
    edge('langfuse', 'clickhouse', { color: '#34D399', label: 'Traces · Observations · Scores' }, { sourceHandle: 'st', targetHandle: 'b' }),
  ],
}
