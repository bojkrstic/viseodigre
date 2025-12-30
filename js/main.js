document.addEventListener('DOMContentLoaded', () => {
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      alert('Hvala! Javićemo se uskoro.');
      contactForm.reset();
    });
  }

  const newsListEl = document.querySelector('[data-news-list]');
  const emptyStateEl = document.querySelector('[data-news-empty]');
  const loadingEl = document.querySelector('[data-news-loading]');
  const loginView = document.querySelector('[data-login-view]');
  const adminView = document.querySelector('[data-admin-view]');
  const adminPanel = document.querySelector('[data-admin-panel]');
  const loginForm = document.querySelector('[data-login-form]');
  const loginFeedback = document.querySelector('[data-login-feedback]');
  const logoutBtn = document.querySelector('[data-logout]');
  const newsForm = document.querySelector('[data-news-form]');
  const newsFeedback = document.querySelector('[data-news-feedback]');
  const adminListEl = document.querySelector('[data-admin-list]');
  const cancelEditBtn = document.querySelector('[data-cancel-edit]');
  const formTitle = document.querySelector('[data-form-title]');
  const submitBtn = document.querySelector('[data-submit-btn]');
  const dateInput = newsForm?.querySelector('[name="datum"]');
  const categoryInput = newsForm?.querySelector('[name="kategorija"]');
  const titleInput = newsForm?.querySelector('[name="naslov"]');
  const contentInput = newsForm?.querySelector('[name="sadrzaj"]');

  const state = {
    news: [],
    authenticated: false,
  };
  let editingId = null;

  const todayISO = () => new Date().toISOString().split('T')[0];

  const setFeedback = (element, message, type = 'info') => {
    if (!element) return;
    element.textContent = message;
    element.dataset.state = type;
    element.hidden = !message;
  };

  const toggleAdminView = () => {
    if (!loginView || !adminView) {
      return;
    }

    if (state.authenticated) {
      loginView.hidden = true;
      adminView.hidden = false;
    } else {
      loginView.hidden = false;
      adminView.hidden = true;
    }
  };

  const setFormMode = (news = null) => {
    if (!newsForm) return;

    if (news) {
      editingId = news.id;
      if (categoryInput) categoryInput.value = news.kategorija || 'Vesti';
      if (titleInput) titleInput.value = news.naslov || '';
      if (dateInput) dateInput.value = news.datum || todayISO();
      if (contentInput) contentInput.value = news.sadrzaj || '';
      if (formTitle) formTitle.textContent = 'Izmena vesti';
      if (submitBtn) submitBtn.textContent = 'Sačuvaj izmenu';
      if (cancelEditBtn) cancelEditBtn.hidden = false;
    } else {
      editingId = null;
      newsForm.reset();
      if (categoryInput) categoryInput.value = categoryInput?.defaultValue || 'Vesti';
      if (dateInput) dateInput.value = todayISO();
      if (formTitle) formTitle.textContent = 'Nova vest';
      if (submitBtn) submitBtn.textContent = 'Dodaj vest';
      if (cancelEditBtn) cancelEditBtn.hidden = true;
    }
  };

  const formatDisplayDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderNews = () => {
    if (!newsListEl) return;
    newsListEl.innerHTML = '';

    if (!state.news.length) {
      if (emptyStateEl) emptyStateEl.hidden = false;
      return;
    }

    if (emptyStateEl) emptyStateEl.hidden = true;

    const fragment = document.createDocumentFragment();
    state.news.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'card';

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = `<span class="pill">${item.kategorija || 'Vesti'}</span><span>• ${formatDisplayDate(item.datum)}</span>`;

      const title = document.createElement('h4');
      title.style.margin = '10px 0 8px';
      title.textContent = item.naslov;

      const paragraph = document.createElement('p');
      paragraph.style.margin = '0';
      paragraph.style.color = 'var(--muted)';
      paragraph.style.fontSize = '13px';
      paragraph.textContent = item.sadrzaj;

      article.append(meta, title, paragraph);
      fragment.appendChild(article);
    });

    newsListEl.appendChild(fragment);
  };

  const renderAdminList = () => {
    if (!adminListEl) return;
    adminListEl.innerHTML = '';

    if (!state.news.length) {
      const empty = document.createElement('p');
      empty.style.margin = '0';
      empty.style.color = 'var(--muted)';
      empty.textContent = 'Još nema objavljenih vesti.';
      adminListEl.appendChild(empty);
      return;
    }

    state.news.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'adminListItem';

      const info = document.createElement('div');
      const heading = document.createElement('h5');
      heading.textContent = item.naslov;
      const details = document.createElement('small');
      details.textContent = `${formatDisplayDate(item.datum)} • ${item.kategorija}`;
      info.append(heading, details);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn';
      editBtn.textContent = 'Uredi';
      editBtn.addEventListener('click', () => {
        setFormMode(item);
        setFeedback(newsFeedback, 'Uređujete vest – sačuvaj izmene ili otkaži.', 'info');
        adminPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn';
      deleteBtn.textContent = 'Obriši';
      deleteBtn.addEventListener('click', async () => {
        if (!window.confirm('Obrisati odabranu vest?')) {
          return;
        }
        try {
          const response = await fetch(`/api/vesti/${item.id}`, { method: 'DELETE' });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || 'Brisanje nije uspelo.');
          }
          if (editingId === item.id) {
            setFormMode();
          }
          await fetchNews();
          setFeedback(newsFeedback, 'Vest je obrisana.', 'success');
        } catch (error) {
          setFeedback(newsFeedback, error.message, 'error');
        }
      });

      actions.append(editBtn, deleteBtn);
      row.append(info, actions);
      adminListEl.appendChild(row);
    });
  };

  const fetchNews = async () => {
    if (!newsListEl) return;
    if (loadingEl) {
      loadingEl.textContent = 'Učitavanje objava...';
      loadingEl.hidden = false;
    }
    try {
      const response = await fetch('/api/vesti');
      if (!response.ok) {
        throw new Error('Neuspešno učitavanje vesti.');
      }
      state.news = await response.json();
      renderNews();
      renderAdminList();
      if (loadingEl) loadingEl.hidden = true;
    } catch (error) {
      console.error(error);
      if (loadingEl) {
        loadingEl.textContent = 'Neuspešno učitavanje vesti.';
        loadingEl.hidden = false;
      }
    }
  };

  const fetchSession = async () => {
    if (!loginView || !adminView) return;
    try {
      const response = await fetch('/api/session');
      if (!response.ok) {
        throw new Error('Session unavailable');
      }
      const data = await response.json();
      state.authenticated = Boolean(data.authenticated);
    } catch (error) {
      state.authenticated = false;
    } finally {
      toggleAdminView();
      if (!state.authenticated) {
        setFormMode();
      }
    }
  };

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const payload = {
        username: formData.get('username'),
        password: formData.get('password'),
      };
      setFeedback(loginFeedback, 'Prijava u toku...', 'info');
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Prijava nije uspela.');
        }
        loginForm.reset();
        setFeedback(loginFeedback, data.message || 'Uspešna prijava.', 'success');
        await fetchSession();
        await fetchNews();
      } catch (error) {
        setFeedback(loginFeedback, error.message, 'error');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/logout', { method: 'POST' });
      } finally {
        state.authenticated = false;
        toggleAdminView();
        setFormMode();
        setFeedback(newsFeedback, 'Odjavljeni ste.', 'info');
      }
    });
  }

  if (newsForm) {
    newsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!state.authenticated) {
        setFeedback(newsFeedback, 'Potrebna je prijava kako biste menjali vesti.', 'error');
        return;
      }
      const formData = new FormData(newsForm);
      const payload = {
        kategorija: formData.get('kategorija')?.toString().trim() || 'Vesti',
        naslov: formData.get('naslov')?.toString().trim(),
        datum: formData.get('datum'),
        sadrzaj: formData.get('sadrzaj')?.toString().trim(),
      };

      if (!payload.naslov || !payload.sadrzaj) {
        setFeedback(newsFeedback, 'Naslov i sadržaj su obavezni.', 'error');
        return;
      }

      const isEdit = Boolean(editingId);
      const url = isEdit ? `/api/vesti/${editingId}` : '/api/vesti';
      const method = isEdit ? 'PUT' : 'POST';

      setFeedback(newsFeedback, isEdit ? 'Čuvanje izmena...' : 'Objavljivanje vesti...', 'info');
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Čuvanje nije uspelo.');
        }
        await fetchNews();
        setFormMode();
        setFeedback(newsFeedback, isEdit ? 'Vest je izmenjena.' : 'Nova vest je objavljena.', 'success');
      } catch (error) {
        setFeedback(newsFeedback, error.message, 'error');
      }
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      setFormMode();
      setFeedback(newsFeedback, 'Izmena je otkazana.', 'info');
    });
  }

  setFormMode();
  fetchNews();
  fetchSession();
});
