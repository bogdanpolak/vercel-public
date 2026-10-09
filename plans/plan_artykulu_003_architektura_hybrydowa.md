# Plan Artykułu: „Dlaczego samo AST to za mało: Bezstratna transformacja kodu w Delphi” (Post 003)

Data: 2026-10-09  
Autor: Bogdan Polak  
Seria: *Inżynieria i Rzemiosło Kodu w Delphi* (`blogs.delphi.pl`)  
Projekt źródłowy: `C:\Sources\github\rzemieslnik-kodu`  
Repozytorium publiczne: https://github.com/bogdanpolak/rzemieslnik-kodu

---

## 1. Profil i Metadane Artykułu

* **Tytuł PL:** *Dlaczego samo AST to za mało: Bezstratna transformacja kodu w Delphi*
* **Tytuł EN:** *Why AST Alone Fails: Building Lossless Code Tools in Delphi*
* **Plik docelowy:** `delphi-pl/003-lossless-code-tools-delphi-pl.md` (oraz wersja EN `003-lossless-code-tools-delphi-en.md`)
* **PostId:** `lossless-code-tools-delphiast`
* **Okładka:** `images/003-cover-image.jpg` (dodana do repozytorium)
* **Kategoria / Tagi:** `delphi`, `software-craftsmanship`, `clean-code`, `ast`, `compiler-engineering`, `refactoring`, `testing`
* **Lead (wstęp na blogu):**
  > Gdy programista Delphi decyduje się na budowę własnego narzędzia – formatera, lintera czy analizatora kodu – intuicja podpowiada: „sparsujmy kod do drzewa AST, a potem zrzućmy je z powrotem”. W Object Pascalu to prosta droga do katastrofy. Drzewo AST gubi komentarze, dyrektywy `{$IFDEF}` i modyfikatory typów. W tym artykule pokazujemy architekturę hybrydową projektu *Rzemieślnik Kodu*, która łączy semantykę AST z bezstratnym strumieniem tokenów, gwarantując 100% bezpieczeństwa kodu źródłowego.

---

## 2. Hipotezy do Wyjaśnienia i Weryfikacji z Autorem

Przed przystąpieniem do pisania pełnego tekstu sformułowano poniższy rejestr hipotez. Dzielą się one na **zweryfikowane w kodzie** oraz **decyzje redakcyjne do uzgodnienia**:

### A. Hipotezy Techniczne i Architektoniczne (Zweryfikowane w kodzie)

| Lp. | Hipoteza | Status w repozytorium `rzemieslnik-kodu` | Konsekwencja dla artykułu |
|:---|:---|:---|:---|
| **H1** | **DelphiAST jest drzewem czysto semantycznym (Lossy AST)**, nie składniowym (CST). | **POTWIERDZONA** (`01-analiza-delphiast.md`). AST pomija dyrektywy preprocesora (`{$IFDEF}`), komentarze (`TCommentNode` poza drzewem), modyfikatory (`packed`, `sealed`, `class var`), a literały `#13` zlewa z `'#13'`. | Kluczowy punkt wyjścia artykułu: pokazujemy, że utrata kodu to nie „bug parsera”, lecz cecha architektury kompilatora. |
| **H2** | **Czysty AST-Writer (AST-to-Source) jest nieakceptowalny** w projektach produkcyjnych. | **POTWIERDZONA** (Wariant A w analizie). Próba odtworzenia kodu z samego AST powoduje ciche usunięcie nieaktywnych gałęzi `{$IFDEF}` i zniszczenie komentarzy. | Uzasadnia odrzucenie naiwnego podejścia. Pokazuje przestrogę dla czytelnika. |
| **H3** | **Architektura Hybrydowa (Wariant C)** rozdziela rolę układu od roli zawartości tekstu. | **POTWIERDZONA** (`DelphiAST.Formatter.Engine.pas`, `architecture.svg`). AST decyduje o wcięciach i łamaniu linii; Lexer (`UseDefines = False`) dostarcza surowy tekst tokenów. | Główna oś merytoryczna artykułu: schemat blokowy i objaśnienie separacji ról. |
| **H4** | **Niezmiennik Token Fingerprint** daje matematyczną gwarancję braku utraty kodu. | **POTWIERDZONA** (`TokenFingerprint(Input) == TokenFingerprint(Output)` po usunięciu białych znaków). | Element „Inżynierii Zaufania” – programista legacy code dostaje dowód, że narzędzie nie zmieni semantyki. |
| **H5** | **Idempotentność** (`Format(Format(S)) == Format(S)`) eliminuje fluktuacje w Git. | **POTWIERDZONA** (`demo3_idempotent.dpr` oraz 21 testów golden). | Pokazuje pragmatyzm rzemieślniczy: narzędzie nadaje się do CI/CD i commit hooków. |

### B. Hipotezy Redakcyjne i Narracyjne (Status ustaleń)

| Lp. | Hipoteza redakcyjna | Status / Wybór | Konsekwencje dla treści artykułu |
|:---|:---|:---|:---|
| **H6** | **Zakres tematyczny (Propozycja 1 vs Połączenie 1 i 2):** Czy łączyć architekturę hybrydową z niezmiennikami jakościowymi w Post 003? | **ZATWIERDZONA: Wariant 1 (Połączenie 70/30)** | Pełny inżynierski łuk narracyjny: problem (stratność AST) $\to$ architektura (Wariant C: AST + Lexer) $\to$ matematyczny dowód bezpieczeństwa (`TokenFingerprint` + idempotentność). |
| **H7** | **Metafora przewodnia (Hook):** Jaka analogia najlepiej odda kontrast między AST a kodem źródłowym? | **ZATWIERDZONA: Metafora Rentgena** | AST jest jak zdjęcie rentgenowskie: doskonale widać kości i strukturę składniową, ale próba odtworzenia człowieka z samego rentgena daje szkielet pozbawiony tkanki (komentarzy, dyrektyw preprocesora, modyfikatorów). |
| **H8** | **Dobór kodu źródłowego w listingach:** Jaki poziom szczegółowości kodu pokazać? | **ZATWIERDZONA: Lekka orkiestracja + brzegowe przypadki** | 1. Zwięzły potok z [Example.FormatterArchitecture.pas](file:///c:/Sources/github/rzemieslnik-kodu/docs/Example.FormatterArchitecture.pas)<br>2. Realny przypadek dyrektyw kompilatora z [demo2_compiler_dir.pas](file:///c:/Sources/github/rzemieslnik-kodu/docs/demo2_compiler_dir.pas)<br>3. Kod testu idempotentności z [demo3_idempotent.dpr](file:///c:/Sources/github/rzemieslnik-kodu/docs/demo3_idempotent.dpr) (w przypadku wdrożenia H6 w wariancie łączonym). |
| **H9** | **Ilustracja i Diagramy:** Czy wykorzystujemy gotowy SVG z repozytorium? | **ZATWIERDZONA: Diagram architecture.svg** | Gotowy plik [architecture.svg](file:///c:/Sources/github/rzemieslnik-kodu/docs/architecture.svg) idealnie wizualizuje dwutorowy potok (Top Lane: AST, Bottom Lane: Tokens $\to$ Emitter). Na okładkę przygotujemy opis promptu dla spójnego cover image. |

---

## 3. Szczegółowy Konspekt Artykułu (Sekcja po Sekcji)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   STRUKTURA ARTYKUŁU POST 003                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Haczyk: Pułapka naiwnego parsera (The Naive Formatter Trap)         │
│ 2. Anatomia problemu: Dlaczego AST w Delphi jest stratne (Lossy AST)   │
│ 3. Wzorzec Architektury Hybrydowej (Wariant C – Podział Władzy)       │
│ 4. Implementacja potoku: Krok po kroku w Delphi                        │
│ 5. Inżynieria Zaufania: Token Fingerprint i Idempotentność             │
│ 6. Heurystyki rzemieślnika i Drzewo Decyzyjne                          │
│ 7. Bibliografia i materiały źródłowe                                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Sekcja 1. Haczyk: Pułapka naiwnego parsera
* **Problem z życia:** Programista w zespole Delphi ma dość niespójnego formatowania w starym projekcie (część wcięć po 2 spacje, część po 4, połamane `begin..end`). Postanawia napisać prosty formater bazujący na bibliotece [DelphiAST](file:///c:/Sources/github/rzemieslnik-kodu/delphi-ast/).
* **Naiwny plan:**
  $$\text{Kod źródłowy} \xrightarrow{\text{Parser}} \text{AST} \xrightarrow{\text{Tree-Walker / Pretty Printer}} \text{Nowy kod}$$
* **Szok i cicha katastrofa:**
  - Plik po formacie wygląda ładnie, ale... kompilacja na produkcji wybucha.
  - Dlaczego? Dyrektywa `{$IFDEF LINUX}` wyparowała, a kod specyficzny dla Windows został wklejony na stałe!
  - Komentarze dokumentujące trudne algorytmy zniknęły.
  - Słowa kluczowe `packed record` stały się zwykłymi `record` (rozbita kompatybilność binarna struktur).
* **Analogia (Rentgen vs Żywy Organizm):** AST widzi szkielet składniowy, ale ignoruje tkankę leksykalną.

### Sekcja 2. Dlaczego AST w Delphi jest stratne (Lossy AST)
* **Semantyka vs Składnia Konkretna:** Czym różni się Abstract Syntax Tree (AST) od Concrete Syntax Tree (CST / Parse Tree)?
* **Zestawienie stratności w DelphiAST** (na podstawie badań z `tools/astdump`):
  1. *Ewaluacja preprocesora:* Lexer z `UseDefines = True` ewaluuje warunki i odrzuca nieaktywne gałęzie kodu. Kompilator ich nie widzi, więc parser ich nie tworzy.
  2. *Komentarze poza drzewem:* Węzły `TCommentNode` trafiają do bocznej listy buildera, a w nieaktywnych gałęziach są bezpowrotnie pomijane.
  3. *Utrata precyzji literałów:* Znak `'#13'` i znak nowej linii `#13` stają się w węźle `ntLiteral` identyczną wartością `Value="#13"`.
  4. *Brakujące modyfikatory:* `packed`, `class sealed`, `class abstract`, `reference to`.
* **Wniosek inżynierski:** Budowanie generatora kodu opartego *wyłącznie* na takim AST w Delphi jest niemożliwe bez ryzyka degradacji kodu.

### Sekcja 3. Architektura Hybrydowa: Podział Władzy (Separation of Concerns)
* **Koncepcja Wariantu C:** Zamiast kazać jednemu modelowi robić wszystko, rozdzielamy odpowiedzialności na dwa niezależne tory:
  - **Tor A (Geometria i układ):** Drzewo AST (`TPasSyntaxTreeBuilder`) wie *gdzie* złamać linię i *jak głębokie* dać wcięcie. Nie ma prawa decydować o treści tekstu.
  - **Tor B (Surowa materia kodu):** Drugi przebieg lexera (`TmwPasLex` z flagą `UseDefines = False`) produkuje nienaruszony strumień tokenów (`TSourceTokens`). Zawiera 100% tokenów: komentarze, obie gałęzie `{$IFDEF}`, białe znaki, stałe, modyfikatory.
* **Prezentacja diagramu architektonicznego:**
  - Wstawienie diagramu [architecture.svg](file:///c:/Sources/github/rzemieslnik-kodu/docs/architecture.svg).
  - Objaśnienie 4 komponentów:
    1. `TSourceTokens` – źródło prawdy tekstu.
    2. `TPasSyntaxTreeBuilder` – źródło prawdy struktury.
    3. `TLayoutPlanner` – planista nakładający znaczniki (`TLayoutMark`) na tokeny.
    4. `TTokenEmitter` – emiter składający znaki z zachowaniem reguł odstępów.

### Sekcja 4. Kod krok po kroku: Anatomia potoku
* **Listing 1: Czysty potok orkiestracyjny** (z [Example.FormatterArchitecture.pas](file:///c:/Sources/github/rzemieslnik-kodu/docs/Example.FormatterArchitecture.pas)):
  - Zwięzła, czytelna funkcja `Run(const ASourceCode: string): string` demonstrująca cykl życia obiektów i eleganckie zarządzanie pamięcią w blokach `try..finally`.
* **Listing 2: Wyzwanie dyrektyw kompilatora** (na bazie [demo2_compiler_dir.pas](file:///c:/Sources/github/rzemieslnik-kodu/docs/demo2_compiler_dir.pas)):
  - Jak formater traktuje obie gałęzie `{$IFDEF SOMETHING}` vs `{$ELSE}`:
  - Gałąź aktywna formatowana jest strukturalnie wg reguł planera AST.
  - Gałąź nieaktywna przepisywana jest bezpiecznie „na płasko” (względne wcięcie dyrektywy), bez utraty ani jednego znaku.
* **Listing 3: Przypisywanie znaczników w planerze**:
  - Jak `TLayoutPlanner` oznacza token otwierający `begin` i zamykający `end`, nie modyfikując samego stringa tokena.

### Sekcja 5. Inżynieria Zaufania: Dwa Niezmienniki Bezpieczeństwa
* **Dlaczego programiści nie ufają narzędziom formatującym w Delphi?** Obawa przed zepsuciem kodu w rzadkich konstrukcjach składniowych (generics, inline vars, makra).
* **Niezmiennik 1: Token Fingerprint Preservation**
  $$\text{Fingerprint}(\text{Source}) = \text{Fingerprint}(\text{Formatted})$$
  - Definicja funkcji `TokenFingerprint`: konkatenacja wszystkich tokenów semantycznych z pominięciem białych znaków.
  - Dowód: Jeśli fingerprint wejścia i wyjścia jest identyczny, żaden token nie zginął, nie zmienił typu ani kolejności.
* **Niezmiennik 2: Idempotentność (Idempotence)**
  $$\text{Format}(\text{Format}(S)) = \text{Format}(S)$$
  - Co oznacza brak idempotentności? Kod „pływa” przy każdym zapisie w edytorze, generując puste diffy w systemie Git.
  - Prezentacja testu idempotentności z [demo3_idempotent.dpr](file:///c:/Sources/github/rzemieslnik-kodu/docs/demo3_idempotent.dpr):
    - Wyszukiwanie pierwszej różnicy znak po znaku (`FirstDifference`).
* **Siatka testowa: Golden Master Testing**
  - Wspomnienie o zestawie 21 testów snapshotowych (`tests/golden/`) jako tarczy ochronnej dla refaktoryzacji.

### Sekcja 6. Heurystyki Rzemieślnika i Drzewo Decyzyjne
* **Kiedy warto budować narzędzia hybrydowe w Delphi?**
  - Gdy budujesz formater, linter sprawdzający reguły konwencji, migrator składni lub generator dokumentacji.
* **Tabela decyzyjna: Wybór architektury narzędzia:**
  - *Tylko analiza / Linter readonly:* Wystarczy czyste AST (`TPasSyntaxTreeBuilder`).
  - *Generowanie nowego kodu od zera:* Wystarczy generator szablonowy / CodeDOM.
  - *Modyfikacja lub transformacja istniejącego kodu (In-place Refactoring, Formatter):* **Bezwzględnie architektura hybrydowa (AST + Lexer tokens)**.
* **Podsumowanie:** Zasada minimalnej ingerencji – narzędzie inżynierskie powinno formatować wyłącznie to, o co prosi architektura, zachowując 100% intencji autora kodu.

### Sekcja 7. Źródła i Literatura
* Robert C. Martin – *Clean Code* (rozdział o formatowaniu kodu i komunikacji).
* Martin Fowler – *Refactoring* (bezpieczeństwo transformacji zachowujących zachowanie).
* Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman – *Compilers: Principles, Techniques, and Tools* (Dragon Book – CST vs AST).
* Kod źródłowy projektu: [github.com/bogdanpolak/rzemieslnik-kodu](https://github.com/bogdanpolak/rzemieslnik-kodu) (katalog lokalny: [rzemieslnik-kodu](file:///c:/Sources/github/rzemieslnik-kodu)).
* Biblioteka DelphiAST: [github.com/romanyankovsky/delphiast](https://github.com/romanyankovsky/delphiast) (autor: Roman Yankovsky).
