// app.js
const ROLES = {
  finance: {
    name: 'Jane Doe', initials: 'JD', label: 'Finance Manager', badge: 'Finance',
    access: ['financial', 'compliance', 'reports'],
    queries: ['Summarize Q3 revenue performance', 'What compliance issues were flagged last quarter?', 'Show budget variance for engineering']
  },
  engineer: {
    name: 'Alex Chen', initials: 'AC', label: 'Senior Engineer', badge: 'Engineering',
    access: ['technical', 'logs', 'operational'],
    queries: ['Show me all critical errors from the past 24 hours', 'What API endpoints have the highest latency?', 'Summarize the latest deployment report']
  },
  hr: {
    name: 'Sam Rivera', initials: 'SR', label: 'HR Director', badge: 'HR',
    access: ['hr', 'compliance', 'reports'],
    queries: ['What is our current headcount by department?', 'Summarize compliance training completion', 'Show open requisitions across all teams']
  },
  executive: {
    name: 'Morgan Lee', initials: 'ML', label: 'C-Suite Executive', badge: 'Executive',
    access: ['financial', 'technical', 'hr', 'compliance', 'reports', 'logs', 'operational'],
    queries: ['Give me a full business health summary', 'What are our top operational risks this quarter?', 'Compare Q2 vs Q3 performance']
  },
  intern: {
    name: 'Casey Kim', initials: 'CK', label: 'Intern', badge: 'Intern',
    access: ['reports'],
    queries: ['Where can I find onboarding documents?', 'What public reports are available?', 'Show me the company org chart']
  }
};

const SOURCES = [
  { id: 'financial',   name: 'Financial Records',  icon: '📊', count: '14.2K docs',  color: '#3B8BD4', bg: '#e6f1fb' },
  { id: 'technical',   name: 'Technical Docs',      icon: '💻', count: '8.7K pages', color: '#0F6E56', bg: '#e1f5ee' },
  { id: 'logs',        name: 'JSON Audit Logs',     icon: '🖥', count: '2.1M entries',color: '#533AB7', bg: '#eeedfe' },
  { id: 'hr',          name: 'HR Records',          icon: '👥', count: '4.3K records',color: '#993556', bg: '#fbeaf0' },
  { id: 'compliance',  name: 'Compliance Docs',     icon: '🛡', count: '892 files',   color: '#854F0B', bg: '#faeeda' },
  { id: 'reports',     name: 'Business Reports',    icon: '📈', count: '3.6K reports',color: '#639922', bg: '#eaf3de' },
  { id: 'operational', name: 'Operational Data',    icon: '⚙️', count: '28.9K rows',  color: '#D85A30', bg: '#faece7' },
];

const SOURCE_KEYWORDS = {
  financial:   ['revenue','budget','cost','profit','loss','finance','q3','q2','quarter','variance','spend','expense'],
  technical:   ['api','deploy','code','latency','service','system','endpoint','performance','architecture'],
  logs:        ['error','log','audit','event','trace','debug','alert','incident','exception','crash'],
  hr:          ['headcount','employee','hire','requisition','onboard','staff','team','workforce'],
  compliance:  ['compliance','regulation','policy','risk','gdpr','sox','training','certification'],
  reports:     ['report','summary','overview','analysis','dashboard','business','metric','kpi'],
  operational: ['operation','process','workflow','pipeline','capacity','throughput','inventory'],
};

let currentRole = 'finance';
let queryCount = 0;
let isLoading = false;

function switchRole(role) {
  currentRole = role;
  const r = ROLES[role];
  document.getElementById('user-avatar').textContent = r.initials;
  document.getElementById('user-name').textContent = r.name;
  document.getElementById('user-role-label').textContent = r.label;
  document.getElementById('role-badge').textContent = r.badge;
  renderSources();
  renderSuggestions();
  updateRbacWarning();
}

function renderSources() {
  const r = ROLES[currentRole];
  let accessible = 0;
  document.getElementById('sources-container').innerHTML = SOURCES.map(s => {
    const has = r.access.includes(s.id);
    if (has) accessible++;
    return `<div class="source-item">
      <div class="source-icon" style="background:${s.bg}">${s.icon}</div>
      <div class="source-meta">
        <div class="source-name">${s.name}</div>
        <div class="source-count">${s.count}</div>
      </div>
      <span class="source-access ${has ? 'access-yes' : 'access-no'}">${has ? '✓' : '✗'}</span>
    </div>`;
  }).join('');
  document.getElementById('stat-docs').textContent = r.access.length > 4 ? '52K+' : r.access.length > 2 ? '21K+' : '4K+';
  document.getElementById('stat-sources').textContent = `${accessible}/${SOURCES.length}`;
}

function renderSuggestions() {
  document.getElementById('suggested-queries').innerHTML = ROLES[currentRole].queries
    .map(q => `<button class="sq-btn" onclick="prefillQuery(this.textContent)">${q}</button>`)
    .join('');
}

function updateRbacWarning() {
  const r = ROLES[currentRole];
  const blocked = SOURCES.filter(s => !r.access.includes(s.id));
  const el = document.getElementById('rbac-warning');
  if (blocked.length && currentRole !== 'executive') {
    document.getElementById('rbac-warning-text').textContent =
      `RBAC active: ${r.name} cannot access ${blocked.slice(0,2).map(s=>s.name).join(', ')}${blocked.length > 2 ? '…' : ''}`;
    el.classList.add('visible');
  } else {
    el.classList.remove('visible');
  }
}

function prefillQuery(text) {
  const el = document.getElementById('query-input');
  el.value = text;
  el.focus();
}

function isQueryRelevant(query, sourceId) {
  const q = query.toLowerCase();
  return (SOURCE_KEYWORDS[sourceId] || []).some(k => q.includes(k));
}

async function sendQuery() {
  if (isLoading) return;
  const input = document.getElementById('query-input');
  const query = input.value.trim();
  if (!query) return;

  input.value = '';
  input.style.height = '42px';
  isLoading = true;
  document.getElementById('send-btn').disabled = true;

  document.getElementById('empty-state')?.remove();

  const chatArea = document.getElementById('chat-area');
  queryCount++;
  document.getElementById('stat-queries').textContent = queryCount;

  // User message
  const userMsg = document.createElement('div');
  userMsg.className = 'msg-user';
  userMsg.textContent = query;
  chatArea.appendChild(userMsg);

  // Thinking bubble
  const sysMsg = document.createElement('div');
  sysMsg.className = 'msg-system';
  sysMsg.innerHTML = `
    <div class="msg-header">🤖 <span>Processing…</span></div>
    <div class="thinking-steps">
      <div class="step active" id="s1">🧠 Analyzing query intent</div>
      <div class="step" id="s2">🔀 Routing to relevant sources</div>
      <div class="step" id="s3">🛡 Checking RBAC permissions</div>
      <div class="step" id="s4">☁ Retrieving context</div>
      <div class="step" id="s5">✨ Generating response</div>
    </div>
    <div><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
  chatArea.appendChild(sysMsg);
  chatArea.scrollTop = chatArea.scrollHeight;

  // Animate steps
  for (let i = 1; i <= 5; i++) {
    await delay(300);
    const el = document.getElementById(`s${i}`);
    if (el) { el.classList.remove('active'); el.classList.add('done'); }
    const next = document.getElementById(`s${i+1}`);
    if (next) next.classList.add('active');
  }

  const r = ROLES[currentRole];
  const accessible = SOURCES.filter(s => r.access.includes(s.id));
  const blocked = SOURCES.filter(s => !r.access.includes(s.id));
  const routable = accessible.filter(s => isQueryRelevant(query, s.id));
  const isBlocked = blocked.some(s => isQueryRelevant(query, s.id)) && routable.length === 0;

  const systemPrompt = `You are a secure enterprise RAG assistant with role-based access control.
User: ${r.name}, Role: ${r.label}
Accessible sources: ${accessible.map(s=>s.name).join(', ')}
Restricted (NO ACCESS): ${blocked.map(s=>s.name).join(', ')}
Rules: Only use accessible sources. Cite which source your answer draws from. If restricted data is required, explain the limitation. Be concise (3-5 sentences or short list). No markdown headers.`;

  let aiText;
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: systemPrompt,
        messages: [{ role: 'user', content: query }]
      })
    });
    const data = await res.json();
    aiText = data.content?.map(b => b.text || '').join('') || 'No response generated.';
  } catch (err) {
    aiText = 'Server error. Make sure server.js is running.';
  }

  sysMsg.innerHTML = `<div class="msg-header">🤖 RAG Intelligence · ${r.name}</div>`;

  if (isBlocked) {
    sysMsg.innerHTML += `<div class="denied-msg">🔒 Access restricted. This query requires data (${blocked.filter(s=>isQueryRelevant(query,s.id)).map(s=>s.name).join(', ')}) that your role cannot access. Contact your administrator.</div>`;
  } else {
    const chips = routable.slice(0,4).map(s =>
      `<span class="source-chip"><span style="color:${s.color}">${s.icon}</span> ${s.name}</span>`
    ).join('');
    sysMsg.innerHTML += `
      <div class="msg-bubble">
        ${aiText}
        ${chips ? `<div class="sources-used">${chips}</div>` : ''}
      </div>`;
  }

  chatArea.scrollTop = chatArea.scrollHeight;
  isLoading = false;
  document.getElementById('send-btn').disabled = false;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

switchRole('finance');