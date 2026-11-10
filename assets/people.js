(() => {
  const isZh = document.documentElement.lang === 'zh-CN';
  const dataPath = isZh ? '../../data/people.json' : '../data/people.json';
  
  let allPeople = [];
  let currentSection = 'all';
  let starOnly = false;
  let searchQuery = '';
  let expandedCard = null;

  const grid = document.getElementById('people-grid');
  const searchInput = document.getElementById('people-search');
  const starToggle = document.getElementById('star-toggle');
  const sectionFilters = document.querySelectorAll('.section-filter');

  async function loadPeople() {
    try {
      const response = await fetch(dataPath);
      if (!response.ok) throw new Error('Failed to load data');
      const data = await response.json();
      allPeople = data.people;
      updateCounts();
      renderPeople();
    } catch (error) {
      grid.innerHTML = `<p class="no-results">${isZh ? '加载失败。请刷新页面重试。' : 'Failed to load data. Please refresh the page.'}</p>`;
      console.error('Error loading people:', error);
    }
  }

  function updateCounts() {
    const allCount = allPeople.length;
    const counts = {
      all: allCount,
      AI: allPeople.filter(p => p.section === 'AI').length,
      '生物科技与医学': allPeople.filter(p => p.section === '生物科技与医学').length,
      '商业': allPeople.filter(p => p.section === '商业').length,
      '人生': allPeople.filter(p => p.section === '人生').length,
      '投资人': allPeople.filter(p => p.section === '投资人').length
    };

    sectionFilters.forEach(btn => {
      const section = btn.dataset.section;
      const countEl = btn.querySelector('.count');
      if (countEl && counts[section] != null) {
        countEl.textContent = `(${counts[section]})`;
      }
    });
  }

  function getFilteredPeople() {
    return allPeople.filter(person => {
      if (currentSection !== 'all' && person.section !== currentSection) {
        return false;
      }
      if (starOnly && !person.star) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchText = [
          person.name,
          person.name_en,
          person.name_zh,
          person.tagline,
          person.past,
          publicNow(person),
          person.ideas,
          person.sub
        ].join(' ').toLowerCase();
        if (!searchText.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }

  function renderPeople() {
    const filtered = getFilteredPeople();
    
    if (filtered.length === 0) {
      grid.innerHTML = `<p class="no-results">${isZh ? '没有找到匹配的人物。' : 'No people found matching your filters.'}</p>`;
      return;
    }

    grid.innerHTML = filtered.map(person => createPersonCard(person)).join('');
    
    grid.querySelectorAll('.person-card').forEach(card => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        toggleCard(card);
      });
      card.addEventListener('keydown', (event) => {
        if (event.target.closest('a')) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleCard(card);
        }
      });
    });
  }

  function toggleCard(card) {
    if (expandedCard && expandedCard !== card) {
      expandedCard.setAttribute('data-expanded', 'false');
      expandedCard.setAttribute('aria-expanded', 'false');
    }
    
    const isExpanded = card.getAttribute('data-expanded') === 'true';
    card.setAttribute('data-expanded', !isExpanded);
    card.setAttribute('aria-expanded', !isExpanded);
    
    if (!isExpanded) {
      expandedCard = card;
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } else {
      expandedCard = null;
    }
  }

  function publicNow(person) {
    if (!person.now || person.deceased || person.now_evidence === '推断') return '';
    const parts = person.now.split(/(?<=[。；;])/);
    const internal = /证据|材料支持|已核实|旧知|此项为|此项职务|此项主要|单一来源|未复核|未核实|不写入|本轮|主要依据|依据/;
    let text = parts.filter(part => part.trim() && !internal.test(part)).join('');
    text = text.replace(/[；;]+\s*$/g, '。').replace(/\s+/g, ' ').trim();
    if (text && !/[。！？.]$/.test(text)) text += '。';
    return text;
  }

  function createPersonCard(person) {
    const nowText = publicNow(person);
    const displayRecent = (person.deceased ? [] : (person.recent || []))
      .filter(item => item.evidence === '已核实' || item.evidence === '材料支持')
      .slice(0, 2);

    const previewText = person.past + (nowText ? ' ' + nowText : '');
    const years = formatYears(person);
    
    return `
      <article class="person-card" data-person-id="${escapeHtml(person.id)}" data-expanded="false" aria-expanded="false" tabindex="0">
        <div class="person-header">
          <div class="person-name-group">
            <h2 class="person-name">${escapeHtml(person.name)}</h2>
          </div>
          ${person.star ? '<span class="person-star" aria-label="Starred">★</span>' : ''}
        </div>
        
        <div class="person-meta">
          <span class="person-section">${escapeHtml(person.section)}</span>
          ${person.sub ? `<span class="person-type">${escapeHtml(person.sub)}</span>` : ''}
          ${years ? `<span class="person-years">${escapeHtml(years)}</span>` : ''}
        </div>
        
        ${person.tagline ? `<p class="person-tagline">${escapeHtml(person.tagline)}</p>` : ''}
        
        <div class="person-preview">${escapeHtml(previewText)}</div>
        
        <div class="person-details">
          <div class="detail-section">
            <h3>${isZh ? '过去' : 'Background'}</h3>
            <p>${escapeHtml(person.past)}</p>
            ${nowText ? `<p>${escapeHtml(nowText)}</p>` : ''}
          </div>
          
          <div class="detail-section">
            <h3>${isZh ? '思想' : 'Ideas'}</h3>
            <p>${escapeHtml(person.ideas)}</p>
          </div>
          
          ${Object.keys(person.links || {}).length > 0 ? `
            <div class="detail-section">
              <h3>${isZh ? '链接' : 'Links'}</h3>
              <div class="person-links">
                ${formatLinks(person.links)}
              </div>
            </div>
          ` : ''}
          
          ${displayRecent.length > 0 ? `
            <div class="detail-section">
              <h3>${isZh ? '近期材料' : 'Recent'}</h3>
              <ul class="recent-items">
                ${displayRecent.map(item => `
                  <li class="recent-item">
                    <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>
                    <span class="recent-outlet">· ${escapeHtml(item.outlet)}</span>
                    <div class="recent-date">${item.date}</div>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  function formatLinks(links) {
    const linkLabels = {
      x: 'X',
      blog: isZh ? '博客' : 'Blog',
      newsletter: isZh ? '通讯' : 'Newsletter',
      podcast: isZh ? '播客' : 'Podcast',
      site: isZh ? '网站' : 'Site',
      youtube: 'YouTube'
    };

    let html = '';
    
    for (const [key, value] of Object.entries(links)) {
      if (key === 'x_also' && Array.isArray(value)) {
        value.forEach((url, i) => {
          html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="person-link">X ${i + 2}</a>`;
        });
      } else if (value && typeof value === 'string') {
        const label = linkLabels[key] || key;
        html += `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer" class="person-link">${label}</a>`;
      }
    }
    
    return html;
  }

  function formatYears(person) {
    if (!person.deceased) return '';
    const date = person.death_date || '';
    const year = date.slice(0, 4);
    if (/^\d{4}$/.test(year)) return year;
    return isZh ? '已故' : 'Deceased';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    expandedCard = null;
    renderPeople();
  });

  starToggle.addEventListener('click', () => {
    starOnly = !starOnly;
    starToggle.setAttribute('aria-pressed', starOnly);
    expandedCard = null;
    renderPeople();
  });

  sectionFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      sectionFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSection = btn.dataset.section;
      expandedCard = null;
      renderPeople();
    });
  });

  loadPeople();
})();
