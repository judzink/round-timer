# 🥊 Boks Tajmer

Jednostavan online tajmer za boks / intervalni trening. Radi u pregledaču, mobile-first, bez naloga i bez servera — sva logika je na klijentu.

## Mogućnosti

- **Podesive runde:** broj rundi, trajanje runde, trajanje pauze (ili potpuno **bez pauze**)
- **Glasovne najave** (ugrađeni glas pregledača, bez audio fajlova):
  - „Spremi se" odbrojavanje pre prve runde
  - „X sekundi" upozorenje pred kraj runde
  - „Pauza" i „Kraj treninga"
- **Zvono** na početku i kraju svake runde (3 zvona na kraju treninga) — sintetizovano preko Web Audio API-ja
- **Jezik glasa:** srpski ili engleski (bira se u podešavanjima)
- **Prekidači:** zvuk / glas / vibracija zasebno
- **Kružni prsten + veliki brojevi**, boja menja fazu (žuta = spremi se, zelena = runda, crvena = poslednjih par sekundi, plava = pauza)
- **Ekran ostaje upaljen** tokom treninga (Screen Wake Lock)
- **Vibracija** na promene faze (telefon)
- **Pauza / Preskoči / Stop** kontrole
- Poslednja podešavanja se pamte (localStorage)

## Pokretanje (razvoj)

```bash
npm install
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

> Zvuk i glas krену tek posle prvog klika na **START** (pregledači blokiraju automatski zvuk dok korisnik ne interaguje sa stranicom).

## Produkcija

```bash
npm run build
npm run start
```

Najlakši deploy: push na GitHub → import na [Vercel](https://vercel.com/new). Pošto je sve na klijentu, može i bilo koji drugi hosting.

## Struktura

| Putanja | Uloga |
| --- | --- |
| `app/page.tsx` | Glavni ekran — bira Podešavanja ili Tajmer |
| `app/layout.tsx` | Root layout, dark tema, viewport |
| `lib/types.ts` | Tipovi + podrazumevana konfiguracija |
| `lib/useBoxingTimer.ts` | Srce aplikacije — state machine + precizan (timestamp) tajmer |
| `lib/audio.ts` | Zvono (Web Audio) + glas (Web Speech) |
| `lib/storage.ts` | Čuvanje/učitavanje podešavanja |
| `components/SettingsScreen.tsx` | Ekran za podešavanje |
| `components/TimerScreen.tsx` | Ekran tajmera (prsten + kontrole) |
| `components/CircularRing.tsx` | SVG kružni prsten |
| `components/Stepper.tsx` | +/− kontrola |

## Napomene

- **Srpski glas** nije instaliran na svim uređajima; ako ga nema, pregledač koristi podrazumevani glas. Zato zvono i vibracija nose glavni signal, a glas je dopuna. Engleski glas radi svuda.
- Wake Lock i zvuk zahtevaju `https` ili `localhost`.
