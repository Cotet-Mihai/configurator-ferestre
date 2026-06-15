# Advanced Window Configurator

Configurator de ferestre pentru WooCommerce: clientul își configurează fereastra
direct pe pagina produsului (număr geamuri, deschidere, dimensiuni, sticlă,
culoare, feronerie), vede un preview SVG live cu prețul care se actualizează în
timp real și adaugă fereastra configurată direct în coș.

Proiectul are **două componente** care lucrează împreună:

| Componentă | Locație | Rol |
|---|---|---|
| **Plugin WordPress** | `plugin/advanced-window-configurator.php` | Buton pe produs, câmpuri în admin, pagină fullscreen, adăugare în coș |
| **Calculator (Next.js)** | `app/`, `components/`, `lib/` | Interfața de configurare, randată ca export static și încărcată în iframe |

Pluginul afișează calculatorul într-un `<iframe>` la calea
`/configurator-ferestre`, îi trimite datele produsului prin URL (base64) și
primește configurația finală înapoi prin `postMessage`, apoi o adaugă în coș cu
prețul calculat.

---

## Cerințe

- WordPress + **WooCommerce** activ
- PHP 7.4+
- Pentru build-ul calculatorului: **Node.js 20+** și **pnpm**
- Calculatorul trebuie servit pe **același domeniu** cu site-ul WordPress (la calea `/configurator-ferestre`)

---

## Instalare

### 1. Construiește calculatorul (exportul static)

```bash
pnpm install
pnpm build
```

Rezultă folderul `out/`. Proiectul e configurat (`next.config.ts`) cu
`output: "export"` și `basePath: "/configurator-ferestre"`, deci toate fișierele
referă calea `/configurator-ferestre/...`.

### 2. Publică exportul la rădăcina site-ului

Copiază **conținutul** din `out/` într-un folder numit `configurator-ferestre/`
la rădăcina web a site-ului, astfel încât să fie accesibil la
`https://domeniul-tau.ro/configurator-ferestre/`:

```bash
# de pe server, din rădăcina site-ului WordPress
mkdir -p configurator-ferestre
cp -r /cale/catre/proiect/out/. configurator-ferestre/
```

> Verificare: `https://domeniul-tau.ro/configurator-ferestre/` trebuie să încarce
> configuratorul, iar `https://domeniul-tau.ro/configurator-ferestre/_next/...`
> să răspundă cu 200.

### 3. Instalează pluginul

Copiază fișierul pluginului în `wp-content/plugins/` (într-un folder propriu):

```bash
mkdir -p wp-content/plugins/advanced-window-configurator
cp plugin/advanced-window-configurator.php wp-content/plugins/advanced-window-configurator/
```

Apoi în **WP Admin → Plugins** activează **Advanced Window Configurator**.
(La activare se înregistrează automat ruta `/configureaza-fereastra`.)

> Dacă butonul nu apare imediat pe produse, mergi la
> **Settings → Permalinks → Save Changes** ca să reîmprospătezi rewrite rules.

---

## Configurare pe produs

1. Editează un produs în WooCommerce.
2. Deschide tab-ul **Product data → Configurator Ferestre**.
3. Bifează **Activează configuratorul pentru acest produs**.
4. Setează **Preț per m² (RON)** — prețul de bază al ferestrei.
5. Adaugă opțiunile (cu modificator de preț per opțiune):
   - **Opțiuni sticlă** — etichetă, +RON/m²
   - **Opțiuni culori** — etichetă, +RON/m², culoare (hex)
   - **Opțiuni feronerie** — etichetă, +RON/buc
6. Salvează. Pe pagina produsului apare butonul **„Configurează fereastra"**.

Dacă nu setezi opțiuni, pluginul folosește valori implicite, deci configuratorul
funcționează oricum.

---

## Cum funcționează fluxul

```
Pagina produsului ──[buton "Configurează fereastra"]──► /configureaza-fereastra/?product=<base64>
        │                                                        │
        │                                              pagină fullscreen cu <iframe>
        │                                                        ▼
        │                                  /configurator-ferestre/?product=<base64>
        │                                          (calculatorul Next.js)
        │                                                        │
        │                       clientul configurează fereastra → "Trimite configurația"
        │                                                        ▼
        └─────────────◄── postMessage(TC_CONFIGURATOR_OUTPUT) ────┘
                                     │
                      AJAX add-to-cart → produs în coș cu prețul calculat
```

Prețul se calculează ca: `suprafață × (preț/m² + modificatori sticlă/culoare)`,
înmulțit cu un multiplicator după tipul de deschidere (fixă ×1.0, cu deschidere
×1.5, oscilobatant ×1.6), plus feroneria. Datele produsului sunt trimise
calculatorului prin `?product=` (JSON base64); configurația finală + prețul revin
prin `postMessage` și se salvează în coș și în comandă.

---

## Dezvoltare

```bash
pnpm dev      # server de dezvoltare la http://localhost:3000
pnpm build    # export static în out/
pnpm lint     # ESLint
```

Stack: Next.js 16 (App Router, export static) · React 19 · TypeScript ·
Tailwind CSS v4 · Framer Motion.

La orice modificare a calculatorului trebuie să refaci `pnpm build` și să
recopiezi `out/` (pasul 2). Modificările la plugin (PHP) se aplică instant.
