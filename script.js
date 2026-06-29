/**
 * 领世1对1 · 提分案例库 - 筛选逻辑 v2
 * 新字段：年级、学科、地区、伴学师、类型、提分幅度、总分选段
 */

let allRecords = [];
let currentFilters = {
  grade: '', subject: '', region: '', type: '',
  score_range: '', total_score: '', teacher: ''
};
let searchQuery = '';

// DOM refs
const cardGrid = document.getElementById('cardGrid');
const resultCount = document.getElementById('resultCount');
const activeFiltersDiv = document.getElementById('activeFilters');
const quickStats = document.getElementById('quickStats');
const searchInput = document.getElementById('searchInput');
const searchCount = document.getElementById('searchCount');
const modalOverlay = document.getElementById('modalOverlay');
const modalImage = document.getElementById('modalImage');
const modalInfo = document.getElementById('modalInfo');
const resetBtn = document.getElementById('resetBtn');

const filterSelects = {
  grade: document.getElementById('filterGrade'),
  subject: document.getElementById('filterSubject'),
  region: document.getElementById('filterRegion'),
  type: document.getElementById('filterType'),
  score_range: document.getElementById('filterScoreRange'),
  total_score: document.getElementById('filterTotalScore'),
  teacher: document.getElementById('filterTeacher')
};

const filterLabels = {
  grade: '年级', subject: '学科', region: '地区',
  type: '类型', score_range: '提分幅度', total_score: '总分选段', teacher: '伴学师'
};

// ==================== Init ====================

async function init() {
  try {
    const resp = await fetch('data.json');
    allRecords = await resp.json();
    populateFilters();
    renderCards();
  } catch (err) {
    cardGrid.innerHTML = `<div class="loading">数据加载失败: ${err.message}</div>`;
  }
}

// ==================== Populate Filters ====================

function populateFilters() {
  for (const field of Object.keys(filterSelects)) {
    const values = [...new Set(allRecords.map(r => r[field]).filter(Boolean))].sort();
    const select = filterSelects[field];
    const group = select.closest('.filter-group');

    if (values.length === 0) {
      if (group) group.style.display = 'none';
      continue;
    }
    if (group) group.style.display = '';

    while (select.options.length > 1) select.remove(1);
    for (const val of values) {
      const option = document.createElement('option');
      option.value = val;
      option.textContent = val;
      select.appendChild(option);
    }
  }
}

// ==================== Filter Logic ====================

function getFilteredRecords() {
  return allRecords.filter(record => {
    for (const [field, value] of Object.entries(currentFilters)) {
      if (value && record[field] !== value) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable = [
        record.region, record.teacher, record.grade, record.subject,
        record.type, record.score_range, record.total_score,
        record.description
      ].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });
}

// ==================== Render ====================

function renderCards() {
  const filtered = getFilteredRecords();
  if (filtered.length === 0) {
    cardGrid.innerHTML = `<div class="no-results"><div class="icon">🔍</div><p>没有匹配的案例</p></div>`;
  } else {
    cardGrid.innerHTML = filtered.map(buildCard).join('');
  }
  updateStats();
}

function buildCard(record) {
  const tags = [];
  if (record.grade) tags.push(`<span class="card-tag tag-grade">${record.grade}</span>`);
  if (record.subject) tags.push(`<span class="card-tag tag-subject">${record.subject}</span>`);
  if (record.type) tags.push(`<span class="card-tag tag-type">${record.type}</span>`);

  // 高亮行：地区 + 提分幅度 + 总分
  const highlights = [];
  if (record.region) highlights.push(`<span class="hl-item hl-region">📍 ${record.region}</span>`);
  if (record.score_range) highlights.push(`<span class="hl-item hl-score">📈 ${record.score_range}</span>`);
  if (record.total_score) highlights.push(`<span class="hl-item hl-total">🏆 ${record.total_score}</span>`);

  return `
    <div class="card" onclick="openModal(${allRecords.indexOf(record)})">
      <img class="card-image" src="${record.image}" alt="提分明细" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="card-image-placeholder" style="display:none;">📷</div>
      <div class="card-body">
        <div class="card-meta">${tags.join('')}</div>
        ${highlights.length > 0 ? `<div class="card-highlights">${highlights.join('')}</div>` : ''}
        <div class="card-desc">${(record.description || '').substring(0, 80)}</div>
        <div class="card-teacher">${record.teacher || ''}</div>
      </div>
    </div>
  `;
}

function updateStats() {
  const filtered = getFilteredRecords();
  const total = allRecords.length;
  resultCount.textContent = filtered.length === total
    ? `${total} 条记录`
    : `${filtered.length} / ${total} 条`;

  if (filtered.length > 0 && filtered.length < total) {
    const regions = [...new Set(filtered.map(r => r.region).filter(Boolean))].sort();
    quickStats.textContent = `当前: ${regions.slice(0, 5).join('、')}${regions.length > 5 ? '…' : ''}`;
  } else {
    quickStats.textContent = '';
  }
  searchCount.textContent = searchQuery ? `匹配 ${filtered.length} 条` : '';
}

// ==================== Active Filter Chips ====================

function renderActiveFilters() {
  const chips = [];
  for (const [field, value] of Object.entries(currentFilters)) {
    if (value) {
      chips.push(`<span class="filter-chip" onclick="clearFilter('${field}')" title="点击清除">${filterLabels[field]}: ${value}<span class="chip-close">×</span></span>`);
    }
  }
  activeFiltersDiv.innerHTML = chips.join('');
}

function clearFilter(field) {
  filterSelects[field].value = '';
  currentFilters[field] = '';
  renderActiveFilters();
  renderCards();
}

// ==================== Events ====================

for (const [field, select] of Object.entries(filterSelects)) {
  select.addEventListener('change', () => {
    currentFilters[field] = select.value;
    renderActiveFilters();
    renderCards();
  });
}

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  renderCards();
});

resetBtn.addEventListener('click', () => {
  for (const [field, select] of Object.entries(filterSelects)) {
    select.value = '';
    currentFilters[field] = '';
  }
  searchQuery = '';
  searchInput.value = '';
  renderActiveFilters();
  renderCards();
});

// ==================== Modal ====================

function openModal(index) {
  const record = allRecords[index];
  if (!record) return;

  modalImage.src = record.image;
  modalInfo.innerHTML = `
    <h3>📋 提分案例详情</h3>
    <div class="meta-row" style="margin-bottom:10px;">
      <span class="card-tag tag-grade">${record.grade || ''}</span>
      <span class="card-tag tag-subject">${record.subject || ''}</span>
      <span class="card-tag tag-type">${record.type || ''}</span>
    </div>
    <div class="meta-row" style="margin-bottom:10px;">
      ${record.region ? `<span class="card-tag tag-region">📍 ${record.region}</span>` : ''}
      ${record.score_range ? `<span class="card-tag tag-score-range">📈 ${record.score_range}</span>` : ''}
      ${record.total_score ? `<span class="card-tag tag-total-score">🏆 ${record.total_score}</span>` : ''}
    </div>
    <div class="meta-row" style="margin-bottom:10px;">
      <span class="card-tag tag-teacher">👩‍🏫 ${record.teacher || ''}</span>
    </div>
    ${record.description ? `<p style="margin-top:10px;font-size:0.9rem;color:#475569;line-height:1.6;">💬 ${record.description}</p>` : ''}
  `;

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  modalImage.src = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); }
});

document.addEventListener('DOMContentLoaded', init);
