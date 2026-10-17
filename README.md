# GymPal

Mobilna aplikacija za praćenje treninga u teretani, u stilu Hevyja (Expo / React Native, Android i iOS).

## Mogućnosti

- **Rutine** — složi svoj trening od vježbi koje odabereš (broj serija, vrijeme odmora).
- **Baza od 870+ vježbi** — slike, upute, mišićne skupine i oprema iz
  [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (javno vlasništvo), ugrađene u aplikaciju
  pa rade i bez interneta. Pretraga razumije i hrvatske pojmove (čučanj, potisak, prsa, bučice…).
  Za svaku vježbu gumb **"Pogledaj video"** otvara YouTube s pretragom te vježbe.
- **Trening uživo** — štoperica trajanja, unos kilaže i ponavljanja po seriji, kvačica za odrađenu
  seriju, odbrojavanje odmora s vibracijom, serije za zagrijavanje, dodavanje i uklanjanje vježbi i serija u hodu.
  Ekran ostaje upaljen, a trening se sprema i ako se aplikacija zatvori.
- **Prethodni rezultat** — uz svaku seriju prikazuje se kilaža × ponavljanja s prošlog treninga te vježbe;
  prazna polja ga predlažu, a dodir ga kopira.
- **Rekordi** — najveća težina, procijenjeni 1RM (Epley), najveći volumen; nova oznaka 🏆 već tijekom treninga
  i sažetak rekorda na kraju.
- **Statistika** — treninzi, volumen i trajanje po tjednima, niz tjedana zaredom, serije po mišićima u
  zadnjih 30 dana, osobni rekordi; za svaku vježbu graf napretka i povijest.
- **Povijest** — svi treninzi s detaljima i ponavljanje treninga.
- **Vlastite vježbe** za ono čega nema u bazi.

Podaci se spremaju lokalno na uređaju.

## Pokretanje

```bash
npm install
npx expo start      # skeniraj QR kod aplikacijom Expo Go
npm run typecheck
npm test
node scripts/update-exercises.mjs   # osvježi bazu vježbi
```

Svaki push na `develop` pokreće GitHub Actions workflow koji builda Android APK i objavljuje ga pod
**Releases**.
