# Više od igre – vesti sa PostgreSQL-om

Sajt sada ima jednostavan Express backend povezan sa PostgreSQL bazom kako bi se vesti unosile direktno sa stranice kroz admin panel.

## 1. Priprema okruženja

1. Instaliraj Node.js (>=18) i PostgreSQL.
2. Instaliraj dependencije:
   ```bash
   npm install
   ```
3. Kreiraj bazu i tabelu:
   ```bash
   createdb viseodigre
   psql viseodigre < db/schema.sql
   ```

## 2. Konfiguracija

1. Kopiraj `.env.example` u `.env` i upiši vrednosti:
   ```bash
   cp .env.example .env
   ```
2. Popuni `DATABASE_URL` ili pojedinačne PG varijable.
3. Podesi `SESSION_SECRET` i administratorsko korisničko ime.
4. Generiši hash lozinke (preporučeno):
   ```bash
   npm run hash-password -- moja-tajna-lozinka
   ```
   Kopiraj dobijeni hash u `ADMIN_PASSWORD_HASH`. Za lokalni razvoj može se privremeno koristiti i obična vrednost preko `ADMIN_PASSWORD`, ali to izbegavaj u produkciji.

## 3. Pokretanje

- Razvojni mod (sa auto-reload):
  ```bash
  npm run dev
  ```
- Produkcijski mod:
  ```bash
  npm start
  ```

Server sluša na `http://localhost:3000`, servira statički sajt i API rute.

## 4. Korišćenje admin panela

1. Otvori sekciju „Najnovije vesti“ na sajtu.
2. Prijavi se pomoću korisničkog imena i lozinke iz `.env` fajla.
3. Nakon prijave pojavljuje se forma za dodavanje, izmenu i brisanje vesti:
   - uneseni podaci se čuvaju u PostgreSQL tabeli `vesti`;
   - lista vesti se automatski osvežava i na javnom delu i u admin listi;
   - dugme „Otkaži izmenu“ resetuje formu na kreiranje nove vesti.

## 5. API pregled

Sve rute su prefiksirane sa `/api`:

- `GET /api/vesti` – javno lista vesti.
- `POST /api/login` / `POST /api/logout` – prijava/odjava admin korisnika (session-based).
- `POST /api/vesti` – kreira vest (zahteva prijavu).
- `PUT /api/vesti/:id` – ažurira vest (zahteva prijavu).
- `DELETE /api/vesti/:id` – briše vest (zahteva prijavu).

Za dodatne korisnike dovoljno je da dodeliš novo korisničko ime/lozinku u `.env` i podeliš pristup.
