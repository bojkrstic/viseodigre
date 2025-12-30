require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'vise-od-igre-secret';

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
  }),
);

const requireAuth = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  return res.status(401).json({ message: 'Potrebna je prijava.' });
};

const mapNewsRow = (row) => ({
  id: row.id,
  kategorija: row.kategorija,
  naslov: row.naslov,
  sadrzaj: row.sadrzaj,
  datum: row.datum ? row.datum.toISOString().split('T')[0] : null,
});

app.get('/api/vesti', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, kategorija, naslov, sadrzaj, datum FROM vesti ORDER BY datum DESC, id DESC',
    );
    res.json(result.rows.map(mapNewsRow));
  } catch (error) {
    console.error('Greška pri čitanju vesti', error);
    res.status(500).json({ message: 'Neuspelo učitavanje vesti.' });
  }
});

app.post('/api/vesti', requireAuth, async (req, res) => {
  const { kategorija = 'Vesti', naslov, sadrzaj, datum } = req.body;

  if (!naslov || !sadrzaj) {
    return res.status(400).json({ message: 'Naslov i sadržaj su obavezni.' });
  }

  const parsedDate = datum ? new Date(datum) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Neispravan datum.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO vesti (kategorija, naslov, sadrzaj, datum) VALUES ($1, $2, $3, $4) RETURNING id, kategorija, naslov, sadrzaj, datum',
      [kategorija, naslov, sadrzaj, parsedDate.toISOString().split('T')[0]],
    );
    res.status(201).json(mapNewsRow(result.rows[0]));
  } catch (error) {
    console.error('Greška pri kreiranju vesti', error);
    res.status(500).json({ message: 'Neuspelo čuvanje vesti.' });
  }
});

app.put('/api/vesti/:id', requireAuth, async (req, res) => {
  const newsId = Number(req.params.id);
  const { kategorija = 'Vesti', naslov, sadrzaj, datum } = req.body;

  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ message: 'Neispravan ID vesti.' });
  }

  if (!naslov || !sadrzaj) {
    return res.status(400).json({ message: 'Naslov i sadržaj su obavezni.' });
  }

  const parsedDate = datum ? new Date(datum) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Neispravan datum.' });
  }

  try {
    const result = await pool.query(
      'UPDATE vesti SET kategorija = $1, naslov = $2, sadrzaj = $3, datum = $4 WHERE id = $5 RETURNING id, kategorija, naslov, sadrzaj, datum',
      [kategorija, naslov, sadrzaj, parsedDate.toISOString().split('T')[0], newsId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Vest nije pronađena.' });
    }

    res.json(mapNewsRow(result.rows[0]));
  } catch (error) {
    console.error('Greška pri izmeni vesti', error);
    res.status(500).json({ message: 'Neuspela izmena vesti.' });
  }
});

app.delete('/api/vesti/:id', requireAuth, async (req, res) => {
  const newsId = Number(req.params.id);

  if (!Number.isInteger(newsId)) {
    return res.status(400).json({ message: 'Neispravan ID vesti.' });
  }

  try {
    const result = await pool.query('DELETE FROM vesti WHERE id = $1', [newsId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Vest nije pronađena.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Greška pri brisanju vesti', error);
    res.status(500).json({ message: 'Neuspelo brisanje vesti.' });
  }
});

app.get('/api/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session?.user), user: req.session?.user || null });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';

  if (!username || !password) {
    return res.status(400).json({ message: 'Unesite korisničko ime i lozinku.' });
  }

  if (username !== adminUser) {
    return res.status(401).json({ message: 'Pogrešni pristupni podaci.' });
  }

  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    console.error('Administrator kredencijali nisu postavljeni.');
    return res.status(500).json({ message: 'Admin nalog nije konfigurisan. Kontaktiraj održavanje.' });
  }

  try {
    let authenticated = false;
    if (process.env.ADMIN_PASSWORD_HASH) {
      authenticated = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    } else if (process.env.ADMIN_PASSWORD) {
      authenticated = password === process.env.ADMIN_PASSWORD;
    }

    if (!authenticated) {
      return res.status(401).json({ message: 'Pogrešni pristupni podaci.' });
    }

    req.session.user = { username: adminUser };
    res.json({ message: 'Uspešna prijava.' });
  } catch (error) {
    console.error('Greška prilikom prijave', error);
    res.status(500).json({ message: 'Prijava trenutno nije moguća.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server sluša na http://localhost:${PORT}`);
});
