import { type DiagramDef, cnode, edge } from './types'

// Non-technical "use case" illustrations — everyday scenarios that show what ClickHouse does,
// without AWS service names or jargon. ClickHouse is the engine in the middle of each story.

// 1) Real-time analytics — an online store's live dashboard
export const ucRealtime: DiagramDef = {
  id: 'uc-real-time',
  title: 'Real-time Analytics',
  description:
    'As shoppers browse and buy, ClickHouse updates a live dashboard the instant it happens — so the team can see what’s selling and react in seconds.',
  nodes: [
    cnode('shoppers', 160, 330, { label: 'Online Shoppers', sub: 'Browsing & buying', category: 'source', icon: 'people' }),
    cnode('storeapp', 480, 330, { label: 'Store Website & App', sub: 'Every click & order', category: 'source', icon: 'cart' }),
    cnode('clickhouse', 820, 330, { label: 'ClickHouse', sub: 'Crunches every event instantly', category: 'clickhouse', icon: 'clickhouse', badge: 'Live', stats: ['Millions of rows/sec', 'Sub-second queries'], hero: true }),
    cnode('dashboard', 1160, 200, { label: 'Live Dashboard', sub: 'Sales & visitors right now', category: 'consume', icon: 'dashboard' }),
    cnode('team', 1160, 470, { label: 'Store Team', sub: 'Reacts in seconds', category: 'consume', icon: 'user' }),
  ],
  edges: [
    edge('shoppers', 'storeapp', { label: 'Browse & buy' }),
    edge('storeapp', 'clickhouse', { label: 'Live activity' }),
    edge('clickhouse', 'dashboard', { label: 'Up-to-the-second' }),
    edge('clickhouse', 'team', { label: 'Act now' }),
  ],
}

// 2) Data warehouse — a retail chain bringing all its data together
export const ucWarehouse: DiagramDef = {
  id: 'uc-warehouse',
  title: 'Data Warehouse',
  description:
    'ClickHouse brings together sales from every store, the website, and the app — so leaders can answer big questions across years of data in seconds.',
  nodes: [
    cnode('stores', 160, 200, { label: 'Store Sales', sub: 'Every location', category: 'source', icon: 'store' }),
    cnode('online', 160, 360, { label: 'Online Orders', sub: 'The website', category: 'source', icon: 'cart' }),
    cnode('app', 160, 520, { label: 'Mobile App', sub: 'Loyalty & usage', category: 'source', icon: 'apps' }),
    cnode('clickhouse', 580, 360, { label: 'ClickHouse', sub: 'All your data, together', category: 'clickhouse', icon: 'clickhouse', badge: 'One source of truth', stats: ['Petabyte scale', 'Answers in seconds'], hero: true }),
    cnode('reports', 960, 250, { label: 'Business Reports', sub: 'What sells? Where? When?', category: 'consume', icon: 'bi' }),
    cnode('leadership', 960, 470, { label: 'Leadership', sub: 'Confident decisions', category: 'consume', icon: 'user' }),
  ],
  edges: [
    edge('stores', 'clickhouse', { label: 'Daily sales' }),
    edge('online', 'clickhouse', { label: 'Orders' }),
    edge('app', 'clickhouse', { label: 'App activity' }),
    edge('clickhouse', 'reports', { label: 'Combine & analyze' }),
    edge('reports', 'leadership', { label: 'Decide' }),
  ],
}

// 3) Observability — keeping a website and apps healthy, with an AI SRE agent on watch
export const ucObservability: DiagramDef = {
  id: 'uc-observability',
  title: 'Observability',
  description:
    'Apps and the website constantly report how they’re doing, and ClickHouse watches it all. An AI SRE agent monitors the data around the clock — automatically detecting and explaining problems, and raising alerts before customers notice.',
  nodes: [
    cnode('apps', 150, 250, { label: 'Apps & Services', sub: 'How they’re running', category: 'source', icon: 'apps' }),
    cnode('website', 150, 470, { label: 'Website', sub: 'Speed & errors', category: 'source', icon: 'globe' }),
    cnode('clickhouse', 540, 360, { label: 'ClickHouse', sub: 'Watches everything, all the time', category: 'clickhouse', icon: 'clickhouse', badge: 'Always on', stats: ['Billions of rows/sec', 'Sub-second search'], hero: true }),
    cnode('dashboard', 920, 210, { label: 'Health Dashboard', sub: 'Everything at a glance', category: 'consume', icon: 'dashboard' }),
    cnode('agent', 920, 480, { label: 'AI SRE Agent', sub: 'Detects & explains errors', category: 'agent', icon: 'robot' }),
    cnode('alerts', 1270, 480, { label: 'Instant Alerts', sub: 'The team is notified', category: 'consume', icon: 'alerts' }),
  ],
  edges: [
    edge('apps', 'clickhouse', { label: 'Health signals' }),
    edge('website', 'clickhouse', { label: 'Speed & errors' }),
    edge('clickhouse', 'dashboard', { label: 'See health' }),
    edge('clickhouse', 'agent', { color: '#B79CFF', label: 'Monitors 24/7' }),
    edge('agent', 'alerts', { color: '#FF7AB6', label: 'Flags & explains issues' }),
  ],
}

// 4) ML / Gen AI — an AI assistant that answers using company knowledge, monitored by Langfuse
export const ucGenai: DiagramDef = {
  id: 'uc-genai',
  title: 'Machine Learning / Gen AI',
  description:
    'An AI assistant answers customer questions accurately by looking up the company’s own knowledge — manuals, FAQs and docs — stored in ClickHouse. Langfuse traces every conversation (also in ClickHouse) so the team can watch quality and improve the AI.',
  nodes: [
    cnode('knowledge', 830, 80, { label: 'Company Knowledge', sub: 'Manuals · FAQs · docs', category: 'source', icon: 'docs' }),
    cnode('customer', 150, 350, { label: 'Customer', sub: 'Asks a question', category: 'source', icon: 'user' }),
    cnode('assistant', 490, 350, { label: 'AI Assistant', sub: 'Understands & replies', category: 'agent', icon: 'robot' }),
    cnode('clickhouse', 830, 350, { label: 'ClickHouse', sub: 'The AI’s searchable memory', category: 'clickhouse', icon: 'clickhouse', badge: 'Knowledge', stats: ['Vector search in ms', 'Billions of vectors'], hero: true }),
    cnode('langfuse', 830, 620, { label: 'Langfuse', sub: 'Tracks & improves the AI', category: 'consume', icon: 'langfuse', badge: 'Powered by ClickHouse' }),
  ],
  edges: [
    edge('knowledge', 'clickhouse', { label: 'Learns from' }, { targetHandle: 't' }),
    edge('customer', 'assistant', { label: 'Question' }),
    edge('assistant', 'clickhouse', { label: 'Finds the answer' }),
    edge('assistant', 'customer', { color: '#34D399', label: 'Accurate answer' }, { sourceHandle: 'sb', targetHandle: 'b' }),
    edge('assistant', 'langfuse', { label: 'Logs every chat' }),
  ],
}
