# User stories and acceptance criteria

Prototype: **Medicine Leaflet Service** (fictional demo data).
Use cases come from the case sheet (UC1–UC3). Failure IDs (F1–F6) refer to the Failure Scenarios sheet:

| ID | Failure scenario (from the canvas) |
|---|---|
| F1 | The medicine is not in the service; the user only gets a "sorry" message |
| F3 | No accessibility features for older users who have trouble reading small text |
| F5 | The app summarises or adds generated content to a leaflet section |
| F6 | The updated leaflet has not been uploaded yet, so an old version is shown as current |

Each criterion says where to see it in the prototype (route in *italics*).

---

## UC1: Patient with a new medicine (primary flow)

### US1.1 Find the medicine
**As a** patient who has just picked up a new medicine, **I want** to find it by scanning the pack or typing its name, **so that** I can get to its leaflet quickly on my way home.

- **Given** I am on the home screen, **when** the page loads, **then** I see a search field labelled "Medicine name or PZN" and a "Scan pack code" button marked **Simulated**. *(`#/`)*
- **Given** I search for a medicine, **when** results are shown, **then** each result shows the product name, strength, form, pack size, PZN and leaflet status, so that products with the same name can be told apart. *(search `novadol` → 4 products)*
- **Given** I choose "Scan pack code", **when** the simulated scan reads a single product, **then** I go to the product check screen with the note "Code read (simulated)". The leaflet does not open yet. *(`#/scan` → Novadol 400 mg pack)*
- **Given** I search, **when** the search runs, **then** only the medicine name or code is used and no request leaves the browser. *(DevTools → Network shows no requests on search)*

### US1.2 Confirm the exact product
**As a** patient, **I want** to check the product details against my pack before the leaflet opens, **so that** I don't read the leaflet for a different strength or form. *(F1, F6)*

- **Given** I select a result, **when** the check screen opens, **then** it shows the name, strength, form, pack, active substance, PZN, and the leaflet version with its revision and publication dates. *(`#/product/novadol-400-ft`)*
- **Given** the check screen, **when** I look for help comparing with my pack, **then** the leaflet's own description of what the medicine looks like is quoted word for word, with its source (section 6, revision date).
- **Given** the product does not match my pack, **when** I choose "No, it doesn't match", **then** the prototype tells me not to use that leaflet and offers: back to results, search again, scan, or ask a pharmacist.
- **Given** I select a result, **when** the product identity or leaflet version is uncertain, **then** the prototype asks me to verify it or sends me to a pharmacist, and does not present the leaflet as current. *(scan "Lumetra pack" → 2 products and a warning; `#/product/restalin-10` → "We can't verify the current leaflet")*

### US1.3 Open the leaflet and find "How to use"
**As a** patient, **I want** to jump straight to the "How to use" section, **so that** I know how to take the medicine without scrolling through the whole leaflet. *(F5)*

- **Given** I confirm the product, **when** the leaflet opens, **then** the header shows the product, a "Current approved version" badge, the revision date, the publication date and the PZN.
- **Given** the leaflet is open, **when** I select "Go to 'How to use'" or section 3 in the section list, **then** the page scrolls to section 3, briefly highlights it, moves focus to its heading and adds `s=s3` to the URL.
- **Given** the leaflet is open, **when** I use the section navigation, **then** all 6 sections stay on the page in full. Nothing is collapsed, shortened, summarised or translated, and the end of the leaflet says "All 6 sections are shown above".
- **Given** any leaflet screen, **when** it is shown, **then** it is labelled "DEMO CONTENT" because the text is fictional.

### US1.4 Make the text easier to read
**As a** patient with tired eyes or poor eyesight, **I want** to enlarge the text and increase contrast, **so that** I can read the leaflet comfortably on my phone. *(F3)*

- **Given** I open a leaflet, **when** I change text size (4 steps up to 200%), contrast (standard, high, high-dark) or line spacing, **then** the layout adapts and the leaflet wording stays exactly the same. *(verified: the leaflet `textContent` is identical before and after)*
- **Given** I change a reading setting while reading, **when** the layout reflows, **then** I stay at the same paragraph.
- **Given** I close and reopen the service on the same device, **when** a page loads, **then** my reading settings are kept on this device only (localStorage). No search history is stored.
- **Given** I use a keyboard or screen reader, **when** I move between screens, **then** focus moves to the page heading, a "Skip to content" link is available, all controls can be reached by keyboard, and status changes are announced through a live region.

### US1.5 Listen to a section (optional)
**As a** patient, **I want** a section read aloud, **so that** I can listen instead of reading small text.

- **Given** a leaflet is open, **when** I choose "Read section 3 aloud", **then** each paragraph of section 3 is spoken in turn using exactly the displayed text, highlighted while it is read, with pause, previous, next, speed and stop controls.
- **Given** read-aloud starts, **when** no built-in (on-device) voice is available, **then** online voices are not used. The prototype shows "Read aloud isn't working on this device" and offers larger text, print, a screen reader or a pharmacist.

---

## UC2: Caregiver helping a parent

### US2.1 Find the parent's medicine from the blister
**As a** daughter helping my father who lost his paper leaflet, **I want** to search by the name printed on the blister, **so that** I can find the right digital leaflet for him.

- **Given** I misspell the name (e.g. `cardivex`), **when** the search completes, **then** the prototype says "No verified match", offers "Did you mean Cardiovex?" as a link to tap (it never auto-corrects), and adds "Only choose it if it matches your pack exactly". *(`#/search?q=cardivex`)*
- **Given** I open Cardiovex 5 mg tablets, **when** the check screen loads, **then** I can see that it is the current version, revised June 2026, and that 2 versions exist.

### US2.2 Print the complete leaflet
**As a** caregiver, **I want** to print the full leaflet on my father's printer, **so that** he has a paper copy again.

- **Given** I choose "Print leaflet", **when** the print screen opens, **then** it names the medicine, PZN, version status, revision and publication dates, and says "Complete leaflet, all 6 sections, unchanged". A full preview is shown. *(`#/print/cardiovex-5`)*
- **Given** the print screen, **when** I have not yet ticked "I have checked that the name, strength and form match the pack", **then** the Print button is disabled.
- **Given** I print, **when** the print dialog opens, **then** only the complete leaflet is printed. Every page has a header with product, PZN, version, status and the demo label. The service then asks "Did the complete leaflet print correctly?"
- **Given** printing fails (answer "No", or the simulated printer failure in the demo guide), **when** the failure is shown, **then** I get recovery steps: check the printer, Save as PDF, read on screen or read aloud, ask the pharmacy for a printed copy.
- **Given** I print a version that is not current, **when** the preview is shown, **then** a warning appears and the printout says "NOT the current version".

### US2.3 Offer read-aloud
**As a** caregiver, **I want** to show my father the read-aloud option, **so that** he can listen to the leaflet himself later.

- **Given** the leaflet is open, **when** I choose "Read aloud", **then** the whole leaflet is read from section 1 in order using the displayed wording, and the status bar shows the section and progress.
- **Given** read-aloud fails or is unavailable (simulated in the demo guide), **when** I start it, **then** a clear failure message appears with alternatives, and the leaflet stays complete on screen.

---

## UC3: Checking a change (capsule colour)

### US3.1 Confirm the exact product
**As a** patient on a long-term medicine whose capsule now looks green instead of red, **I want** to confirm it is the same product, **so that** I compare the right leaflets.

- **Given** I search `gastrozol`, **when** results show, **then** 20 mg and 40 mg capsules are listed separately with strength, form and PZN.
- **Given** I open Gastrozol 20 mg, **when** the check screen shows, **then** the current leaflet's appearance text is quoted word for word, with no comment about the colour.

### US3.2 See current and previous versions
**As a** patient, **I want** to see all approved versions with their dates, **so that** I can tell which one is current.

- **Given** I open "Versions (3)", **when** the list shows, **then** each version shows its revision month, publication date and version ID. Exactly one is labelled "Current approved version" and the others "Previous version · not current". *(`#/versions/gastrozol-20`)*
- **Given** I open a previous version, **when** it is displayed, **then** a banner says it is not the current leaflet and links to the current version and to the comparison.

### US3.3 Compare the same section in both versions
**As a** patient, **I want** to compare the full official text of the current and previous leaflets at the same section, **so that** I can read for myself what each one says.

- **Given** I compare versions, **when** I choose a section ("Go to section in both"), **then** both complete leaflets stay available and the selected section is shown in each: side by side on a laptop, or with a Version 1 / Version 2 switch on a phone that keeps the same section. *(`#/compare/gastrozol-20?a=2026-09&b=2025-03&s=s6`)*
- **Given** I turn on "Mark paragraphs whose wording is not identical", **when** the panes re-render, **then** paragraphs that do not exactly match are highlighted and the differing sections are listed. This is an exact text match only, with no explanation or interpretation.
- **Given** I compare versions, **when** the view loads, **then** a notice says the service can't tell me what a change means, and there is a link to "Ask a pharmacist".

### US3.4 Pharmacist route
**As a** worried patient, **I want** a clear route to a pharmacist, **so that** a qualified person can tell me what the change means.

- **Given** I choose "Ask a pharmacist" from a product, **when** the help page opens, **then** it shows a "Show this to the pharmacist" card with only the product, PZN and leaflet version (no personal data), plus guidance on contacting the pharmacy, out-of-hours service and emergency number 112.
- **Given** the help page, **when** I read it, **then** it says the service cannot advise on symptoms, on changes to a medicine, or on starting, stopping or changing a medicine.

---

## Cross-cutting: safety, recovery and privacy

- **Given** a medicine is not found, **when** the search completes, **then** the prototype explains there is no verified match, shows no leaflet, and offers safe next steps (check spelling, PZN, scan, paper leaflet, pharmacist). *(F1 · `#/search?q=zoltrix`)*
- **Given** the current leaflet cannot be verified, **when** the product is opened, **then** the prototype says so plainly, never labels an older version as current, and offers the paper leaflet or a pharmacist first. The older version can be viewed only with a "may be out of date" label. *(F6 · Restalin)*
- **Given** a scan cannot read the code, **when** the simulation fails, **then** no medicine is guessed and the user can type the name, try again or ask a pharmacist.
- **Given** any screen, **when** it is displayed, **then** there is no free-text question box, chatbot, generated summary, translation or advice. *(F5)*
- **Given** the prototype is used, **when** it runs, **then** it collects no patient profile, diagnosis, medication history or contact details, and sends no data to external services.
