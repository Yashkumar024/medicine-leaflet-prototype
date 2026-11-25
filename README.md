# Medicine Leaflet Service: interactive prototype

A responsive website prototype that helps patients and caregivers find the **correct, current, officially approved medicine leaflet** and read it comfortably on a phone or laptop. It shows leaflet information only. It does not diagnose, interpret symptoms or advise on taking medicine.

> **All medicines, codes (PZN), companies and leaflet texts are fictional demo content** written for this prototype. They are not real medical information.

**Live demo:** https://yashkumar024.github.io/medicine-leaflet-prototype/ (GitHub Pages, deployed from `main`)

## Run it

Plain HTML/CSS/JavaScript. No build step and no dependencies.

```bash
cd medicine-leaflet-prototype
```

```bash
python3 -m http.server 4322 --bind 127.0.0.1
```

Then open **http://localhost:4322**. Any static server works. Opening `index.html` directly from disk also works in most browsers.

## Working case flows

| Case | Status | Start |
|---|---|---|
| **UC1** Patient with a new medicine: scan or search → results → confirm product → leaflet → "How to use" → text size and contrast → read aloud | Works end to end | Home → search `novadol` or Scan → "Novadol 400 mg pack" |
| **UC2** Caregiver: search the name from the blister (typo → "did you mean") → check product and version → leaflet → read aloud → print preview with confirmation → print | Works end to end | `#/search?q=cardivex` |
| **UC3** Capsule colour change: search → confirm → versions list (current/previous with dates) → compare full texts at the same section → optional exact-match marking → pharmacist route | Works end to end | `#/search?q=gastrozol` |

Recovery states: no match (`zoltrix`), code matches two products (scan "Lumetra"), unreadable scan, product doesn't match the pack, current leaflet unavailable (Restalin), print failure and read-aloud failure (switches on the demo guide page).

The in-app **Demo guide** (`#/demo`, linked in the footer) has step lists, one-click starts and the failure switches.

## Suggested 5-minute recording script

1. **0:00 Intro (20 s).** Home screen: demo-data strip, search, simulated scan, privacy and "information only" notes.
2. **0:20 UC1 (2 min).** Search `novadol` and point out the 4 products told apart by strength and form. Open **400 mg film-coated tablets** → check screen (details, version, quoted appearance) → **Yes, it matches** → **Go to "How to use"** → **Text size & contrast**: Larger + High → **Read section 3 aloud**, pause, stop.
3. **2:20 UC2 (1 min 15 s).** Demo guide → Start UC2 (`cardivex` typo → "Did you mean Cardiovex?") → open → **Read aloud** briefly → **Print leaflet** → tick the check → Print (show the preview or the system dialog). Optionally switch on "Simulate a printer failure" to show recovery.
4. **3:35 UC3 (1 min 10 s).** Search `gastrozol` → 20 mg → check screen quotes "green cap" → leaflet → **Versions (3)** → **Compare with current** → section **6** → tick "Mark paragraphs…" → point out the pharmacist notice → **Ask a pharmacist**.
5. **4:45 Recovery (15 s).** `zoltrix` no-match and Restalin "can't verify current leaflet".

Tip: before recording, use **Reset demo** on the demo guide page. Record the UC1 part at phone width as well if possible (browser dev tools → responsive mode, about 390 px).

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell: header, reading-settings dialog, read-aloud bar, footer |
| `styles.css` | Responsive, accessible styles; high-contrast and dark themes; print stylesheet |
| `app.js` | Hash router, views, local search, reading settings, read-aloud, print, compare |
| `data.js` | **Fictional** demo catalogue: 10 products, 14 leaflet versions, scan simulation samples |
| `USER_STORIES.md` | User stories with Given/When/Then acceptance criteria for UC1–UC3 |

## Content, safety and privacy rules (as built)

- Leaflets are rendered **complete and word for word** from `data.js`. No summaries, shortening, translation or generated text. Text size, contrast, spacing and read-aloud only change how the text is presented.
- Read-aloud uses the browser's Web Speech API with **on-device voices only** (`localService === true`). It speaks each displayed paragraph's exact `textContent`. If no local voice exists, it shows a failure state instead of sending text to an online voice.
- "Mark paragraphs whose wording is not identical" in the comparison is a mechanical exact-string match. It does not explain or interpret differences.
- Nothing is said about what a symptom or package change means, or whether to take or stop a medicine. Those questions go to the **Ask a pharmacist** page.
- An unverifiable product or version is never shown as current.
- Search needs only a name or PZN, runs **in the browser**, and makes no network requests. No accounts, no health data, no search history. Only reading settings are stored (`localStorage`); demo failure switches use `sessionStorage`.

## What is simulated or assumed

- **Demo data:** every medicine and leaflet is fictional (fictional substances such as "novadolin", "Demopharm GmbH (fictional company)", PZNs starting `99…`). The leaflet structure follows the usual 6-section EU package leaflet format.
- **Scanning is simulated.** No camera is used; the user picks a demo pack. Real scanning would decode the pack's DataMatrix or barcode (PZN). Assumption A2 on the case sheet: users grant camera access.
- **Approved catalogue:** assumed to be supplied by an authoritative source (manufacturers or the regulator) through the service operator. `data.js` stands in for it. Assumption A1: manufacturers upload new leaflets promptly. The "current leaflet unavailable" state covers the case where they don't (F6).
- **Version status** (current, previous, unverified) is assumed to come from that source. The prototype does not determine it.
- **Language:** the demo leaflets are written in English so the assessment can follow them. They are presented as the approved text, not as translations. A real German deployment would show the approved German text, and the service would not translate it.
- **Print success can't be detected** by a browser, so the prototype asks the user whether it printed. The printer failure is simulated with a switch.
- **Pharmacist route** is informational (pack details to show, opening-hours and emergency guidance). It doesn't connect to a real pharmacy or directory.

## Known gaps

- Read-aloud depends on the browser and OS having an on-device English voice. Chrome and Safari on macOS do. Some Linux or Android setups may show the failure state instead, which is intended but worth checking before recording.
- The print preview is an on-screen approximation. Actual page breaks depend on the browser's print engine.
- No real scanning, backend, catalogue API or authentication. No automated tests.
- No German UI or right-to-left support. Content is English demo text only.
