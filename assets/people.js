(() => {
  'use strict';
  const page = document.querySelector('.people-page');
  if (!page) return;
  const list = page.querySelector('.people-list');
  const people = Array.from(list.querySelectorAll('.person'));
  const form = page.querySelector('.people-toolbar');
  const search = page.querySelector('#people-search');
  const sort = page.querySelector('#people-sort');
  const recent = page.querySelector('#people-recent');
  const result = page.querySelector('#people-count');
  const empty = page.querySelector('.people-empty');
  const buttons = Array.from(page.querySelectorAll('[data-category-filter]'));
  const chinese = document.documentElement.lang.startsWith('zh');
  let category = 'all';
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().trim();
  const searchable = new Map(people.map(person => [person, normalize(person.dataset.search)]));

  function applyFilter(writeUrl = true) {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    const ordered = [...people].sort((a, b) => sort.value === 'recent'
      ? b.dataset.latest.localeCompare(a.dataset.latest) || Number(a.dataset.order) - Number(b.dataset.order)
      : Number(a.dataset.order) - Number(b.dataset.order));
    let count = 0;
    ordered.forEach(person => {
      const visible = (category === 'all' || person.dataset.categories.split(' ').includes(category))
        && (!recent.checked || person.dataset.recent === 'true')
        && words.every(word => searchable.get(person).includes(word));
      person.hidden = !visible;
      if (visible) count += 1;
      list.append(person);
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category)));
    result.textContent = chinese ? `显示 ${count} / ${people.length} 位` : `Showing ${count} of ${people.length} people`;
    empty.hidden = count > 0;
    if (writeUrl) {
      const url = new URL(location.href);
      [['q', search.value.trim()], ['category', category === 'all' ? '' : category],
        ['recent', recent.checked ? '1' : ''], ['sort', sort.value === 'recent' ? 'recent' : '']]
        .forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
      history.replaceState(null, '', url);
    }
  }

  function reset() {
    search.value = '';
    category = 'all';
    recent.checked = false;
    sort.value = 'default';
    applyFilter();
  }

  function restore() {
    const params = new URLSearchParams(location.search);
    search.value = params.get('q') || '';
    const requested = params.get('category');
    category = buttons.some(button => button.dataset.categoryFilter === requested) ? requested : 'all';
    recent.checked = params.get('recent') === '1';
    sort.value = params.get('sort') === 'recent' ? 'recent' : 'default';
    applyFilter(false);
  }

  function openLinkedPerson() {
    const id = location.hash.slice(1);
    const person = people.find(item => item.id === id);
    if (!person) return;
    if (person.hidden) reset();
    person.open = true;
    person.scrollIntoView({ block: 'start' });
  }

  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', () => applyFilter());
  sort.addEventListener('change', () => applyFilter());
  recent.addEventListener('change', () => applyFilter());
  buttons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.categoryFilter;
    applyFilter();
  }));
  page.querySelectorAll('[data-reset-people]').forEach(button => button.addEventListener('click', () => {
    reset();
    search.focus();
  }));
  window.addEventListener('popstate', () => { restore(); openLinkedPerson(); });
  window.addEventListener('hashchange', openLinkedPerson);
  restore();
  openLinkedPerson();
})();
