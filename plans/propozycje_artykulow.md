---
title: Propozycje tematów artykułów dla blogs.delphi.pl
date: 2026-10-04
tags:
  - delphi
  - blog
  - software-craftsmanship
  - architecture
  - clean-code
  - ast
  - refactoring
status: propozycja
source_project: rzemieslnik-kodu
target_platform: https://blogs.delphi.pl/
---

# Propozycje tematów artykułów dla blogs.delphi.pl

Data: 2026-10-04  
Autor projektu: Bogdan Polak  
Projekt źródłowy: `rzemieslnik-kodu` (DelphiAST, delphi-formatter, ast-viewer)  

---

## 1. Analiza profilu i stylu blogs.delphi.pl

Analiza dotychczasowych wpisów na blogu (*001: More Readable Code with Class Helpers* oraz *002: Safe Refactoring with the Introduce Parameter Object Pattern*) wykazuje spójną, rzemieślniczą tożsamość publikacji:

1. **Inżynierskie rzemiosło (Software Craftsmanship):** Nacisk na czysty kod (*Clean Code*), pragmatyczne zarządzanie długiem technicznym, bezpieczeństwo wprowadzania zmian i redukcję ryzyka w projektach Delphi.
2. **Struktura artykułu:**
   - **Haczyk / Problem:** Realny ból programisty Delphi (kod proceduralny, rozproszony stan gry, data clumps, kruchość refaktoryzacji).
   - **Koncepcja i wzorzec:** Wyjaśnienie idei teoretycznej z pragmatycznym uzasadnieniem.
   - **Konkretny kod krok po kroku:** Samodzielne listingi kodu w Delphi, pokazujące transformację przed i po.
   - **Końcowe porady i drzewo decyzyjne:** Praktyczne heurystyki dla programistów i liderów technicznych.
   - **Odnośniki do literatury:** Fowler, Martin, Clean Code, Refactoring Guru itp.
3. **Dwujęzyczność (PL / EN):** Każdy wpis przygotowany jest w wersji polskiej i angielskiej z osobnym leadem i metadanymi.

---

## 2. Unikalny potencjał projektu „Rzemieślnik Kodu”

Repozytorium `rzemieslnik-kodu` zawiera rzadko spotykane w świecie Delphi rozwiązania architektoniczne związane z inżynierią kompilatorów i narzędzi deweloperskich:
- **Rozwiązanie problemu stratnego AST (Lossy AST):** Połączenie parsera semantycznego z bezstratnym strumieniem tokenów lexera (`UseDefines = False`).
- **Niezmienniki jakościowe:** Formalna gwarancja bezpieczeństwa kodu (*Token Fingerprint Preservation* oraz *Idempotentność*).
- **Golden Master Testing:** Zestaw 20 testów snapshotowych dla transformacji kodu wraz z metryką pokrycia węzłów AST (`Coverage.Handled`).
- **Interaktywne GUI VCL:** Wizualizator AST w czasie rzeczywistym z wyzwaniami zarządzania pamięcią (`ReportMemoryLeaksOnShutdown`, cykl życia `TSyntaxNode`) oraz płynnością UI (debouncing).

---

## 3. Cztery propozycje artykułów

---

### Propozycja 1 (Rekomendowana): Architektura hybrydowa narzędzi kodu – dlaczego samo AST to za mało w Delphi

* **Tytuł PL:** *Dlaczego samo AST to za mało: Bezstratna transformacja kodu w Delphi*  
* **Tytuł EN:** *Why AST Alone Fails: Building Lossless Code Tools in Delphi*  
* **Kategoria:** Architektura / Narzędzia deweloperskie / Metaprogramowanie  

#### Problem:
Gdy programista Delphi decyduje się na napisanie własnego narzędzia (formatera, lintera, analizatora architektury czy generatora kodu), pierwszym intuicyjnym pomysłem jest: *„Sparsować kod do drzewa AST, a następnie zserializować drzewo z powrotem do tekstu (AST-to-Source)”*. W świecie Delphi podejście to prowadzi do cichej katastrofy:
- Drzewo semantyczne (np. DelphiAST) jest **stratne**: gubi komentarze, dyrektywy preprocesora `{$IFDEF}` / `{$I}`, modyfikatory `packed`, `class sealed`, `class abstract`, specyfikatory `reference to`.
- Ewaluacja preprocesora sprawia, że **nieaktywne gałęzie kodu znikają bezpowrotnie** – kompilator ich nie widzi, więc parser ich nie zapisuje.
- Literały znakowe ulegają dequotowaniu (`'#13'` zlewa się z `#13`).

#### Koncepcja i architektura rozwiązania (Wariant C – Hybryda):
Rozdzielenie odpowiedzialności pomiędzy dwa źródła prawdy:
1. **AST (`TPasSyntaxTreeBuilder`)** decyduje **wyłącznie o strukturze i układzie** (poziomy wcięć, miejsca łamania wierszy, bloki instrukcji).
2. **Lexer (`TmwPasLex` z `UseDefines = False`)** dostarcza **tekst i tokeny** (`TSourceTokens`) – bezstratnie, z zachowaniem obu gałęzi `{$IFDEF}`, komentarzy i białych znaków.
3. **Planer układu (`TLayoutPlanner`)** nanosi na tokeny znaczniki (`BreakBefore`, `Indent`, `BlankBefore`).
4. **Emiter (`TTokenEmitter`)** składa kod wynikowy, normalizując odstępy, ale nie zmieniając ani jednego tokenu użytkownika.

#### Gotowy kod do zaprezentowania w artykule:
Czysty potok z pliku `docs/Example.FormatterArchitecture.pas`:

```pascal
function Run(const ASourceCode: string): string;
var
  Root: TSyntaxNode;
  Tokens: TSourceTokens;
  Planner: TLayoutPlanner;
  Marks: TTokenMarks;
  Emitter: TTokenEmitter;
begin
  Root := ParseSource(ASourceCode);
  try
    Tokens := TSourceTokens.Create(ASourceCode);
    try
      Planner := TLayoutPlanner.Create(Tokens);
      try
        Marks := Planner.Plan(Root);
      finally
        Planner.Free;
      end;
      Emitter := TTokenEmitter.Create(Tokens, Marks);
      try
        Result := Emitter.Emit;
      finally
        Emitter.Free;
      end;
    finally
      Tokens.Free;
    end;
  finally
    Root.Free;
  end;
end;
```

#### Dlaczego to idealny wpis:
Temat jest unikalny na skalę światowej społeczności Delphi. Nikt dotąd nie opisał publicznie architektury bezstratnego formatera dla Object Pascala. Stanowi doskonały pomost pomiędzy teorią kompilatorów a codziennym rzemiosłem programistycznym.

---

### Propozycja 2: Inżynieria zaufania – Idempotentność i niezmienniki jakościowe w Delphi

* **Tytuł PL:** *Inżynieria zaufania: Idempotentność i niezmienniki jakościowe w Delphi*  
* **Tytuł EN:** *Engineering Trust in Delphi: Idempotence and Invariant-Driven Design*  
* **Kategoria:** Testowanie / Jakość kodu / Software Craftsmanship  

#### Problem:
Dlaczego programiści boją się narzędzi automatycznych w projektach legacy? Ponieważ jedno błędne przestawienie średnika lub usunięcie dyrektywy kompilatora może zepsuć build na produkcji. Tradycyjne testy jednostkowe z kilkoma asercjami nie dają pewności, że silnik nie zepsuje kodu w specyficznych warunkach brzegowych.

#### Koncepcja i niezmienniki:
Matematyczne podejście do bezpieczeństwa transformacji kodu oparte na 3 twardych niezmiennikach:
1. **Token Fingerprint Preservation:** Strumień tokenów semantycznych kodu źródłowego i wynikowego musi być identyczny:
   $$\text{Fingerprint}(\text{Source}) = \text{Fingerprint}(\text{Formatted})$$
   Żadne słowo kluczowe, literał ani komentarz nie mogą zniknąć ani zmienić kolejności.
2. **Idempotentność:** Ponowne uruchomienie formatera na wyjściu daje dokładnie ten sam wynik:
   $$\text{Format}(\text{Format}(S)) = \text{Format}(S)$$
3. **Weryfikacja parsowalności:** Kod wyjściowy musi bezbłędnie parsować się przez kompilator.

#### Gotowy kod do zaprezentowania w artykule:
Mechanizm automatycznego sprawdzania idempotentności z precyzyjną lokalizacją pierwszej różnicy z `docs/demo3_idempotent.dpr`:

```pascal
function Test_Idempotent(AInput: string): TResult;
var
  Formatter: TDelphiCodeFormatter;
begin
  Result.Passed := False;
  Formatter := TDelphiCodeFormatter.Create;
  try
    Result.Actual := NormalizeLineEndings(Formatter.FormatSource(AInput));
    Result.Again  := NormalizeLineEndings(Formatter.FormatSource(Result.Actual));
    
    if Result.Actual = Result.Again then
      Result.Passed := True
    else
      Result.Report := FirstDifference(Result.Actual, Result.Again);
  finally
    Formatter.Free;
  end;
end;
```

#### Dlaczego to idealny wpis:
Uczy programistów myślenia kategoriami niezmienników (*Invariants*) i *Property-Based Testing*, co ma bezpośrednie przełożenie na pisanie bezpiecznego kodu biznesowego (np. operacje bankowe, migracje baz danych, serializację).

---

### Propozycja 3: Golden Master Testing – jak bezpiecznie testować złożone systemy w Delphi

* **Tytuł PL:** *Golden Master Testing: Bezpieczne testowanie złożonych transformacji w Delphi*  
* **Tytuł EN:** *Golden Master Testing: Safe Verification of Complex Transformations in Delphi*  
* **Kategoria:** Testowanie jednostkowe / Refaktoryzacja / Legacy Code  

#### Problem:
Pisanie asercji w testach jednostkowych (`Assert.AreEqual(...)`) dla transformacji dużych struktur danych, generatorów raportów, serializatorów czy parserów jest nieefektywne. Utrzymywanie wieloliniowych stałych stringowych w kodzie testu zaciemnia logikę i zniechęca zespół do pisania testów.

#### Koncepcja i wzorzec:
Wzorzec **Golden Master (Characterization Testing / Approval Testing)**:
- Organizacja danych testowych w pary plików dyskowych: `<nazwa>.in.pas` (wejście) oraz `<nazwa>.out.pas` (wzorzec referencyjny).
- Lekki runner testowy bez zależności zewnętrznych (`dfmt_golden.dpr`) oraz integracja z `DUnitX` (`dfmt_dunitx.dpr`).
- Śledzenie pokrycia obsługiwanych elementów składniowych (`Coverage.Handled` vs `Coverage.Unhandled`) zamiast prostego pokrycia linii kodu.

#### Wartość rzemieślnicza:
Artykuł daje programistom gotowy schemat testowania modułów legacy przed przystąpieniem do ich refaktoryzacji (nawiązanie do książki Michaela Feathersa *Working Effectively with Legacy Code*).

---

### Propozycja 4: Praktyczne AST w VCL – budujemy interaktywne narzędzie deweloperskie

* **Tytuł PL:** *W głąb kodu: Interaktywna wizualizacja AST w Delphi VCL*  
* **Tytuł EN:** *Inside Your Code: Building an Interactive AST Explorer in Delphi VCL*  
* **Kategoria:** VCL / GUI / Narzędzia deweloperskie / Zarządzanie pamięcią  

#### Problem:
Dla większości programistów drzewo składniowe AST jest pojęciem czysto teoretycznym. Zbudowanie responsywnego narzędzia okienkowego w VCL łączącego edytor `TMemo` z widokiem `TTreeView` pozwala zrozumieć, jak kompilator analizuje program. Jednak w środowisku GUI natychmiast ujawniają się dwa krytyczne problemy:
1. **Wycieki pamięci:** Ciągłe parsowanie kodu przy każdym naciśnięciu klawisza tworzy tysiące obiektów `TSyntaxNode`, które bez dyscypliny niszczenia szybko zapychają pamięć.
2. **Blokowanie UI:** Parsowanie dużego pliku synchronicznie w zdarzeniu `OnChange` powoduje zacinanie pętli komunikatów Windows i migotanie widoku.

#### Koncepcja i architektura rozwiązania:
- Zarządzanie cyklem życia drzewa: Własność węzłów w `TSyntaxNode` (rodzic niszczy dzieci), wzorzec `FreeAndNil(FCurrentSyntaxTree)` przed każdą odbudową oraz `ReportMemoryLeaksOnShutdown := True`.
- Wdrożenie mechanizmu **Debounce** za pomocą `TTimer` w VCL (odroczenie parsowania o 300 ms od ostatniego naciśnięcia klawisza).
- Ergonomiczna obsługa błędów składniowych: zachowanie ostatniego poprawnego widoku drzewa i raportowanie błędów w `TStatusBar` z podaniem wiersza i kolumny.

#### Wartość rzemieślnicza:
Połączenie zaawansowanej wiedzy o parsowaniu z twardą, codzienną praktyką tworzenia responsywnych i wolnych od wycieków aplikacji desktopowych w Delphi.

---

## 4. Macierz porównawcza propozycji

| Cecha | Propozycja 1 (Hybryda AST) | Propozycja 2 (Idempotentność) | Propozycja 3 (Golden Master) | Propozycja 4 (AST Viewer VCL) |
|---|---|---|---|---|
| **Dopasowanie do bloga** | Wybitne (Nowość i rzemiosło) | Bardzo wysokie (Czysty kod) | Wysokie (Praktyka testów) | Wysokie (Praktyka VCL) |
| **Unikalność tematu** | Ekstremalnie wysoka | Bardzo wysoka | Średnia (wzorzec znany) | Wysoka |
| **Gotowość kodu w repo** | Gotowy (`Example.FormatterArchitecture.pas`) | Gotowy (`demo3_idempotent.dpr`) | Gotowy (`tests/golden/`) | Wymaga drobnych poprawek (`MainForm.pas`) |
| **Zalecana kolejność** | **Post 003 (Pierwszy wybór)** | Post 004 | Post 005 | Post 006 |

---

## 5. Podsumowanie i rekomendacja

Jako kolejny artykuł (**Post 003**) na `blogs.delphi.pl` zdecydowanie rekomenduję **Propozycję 1: „Dlaczego samo AST to za mało: Bezstratna transformacja kodu w Delphi”**.

1. Stanowi logiczne rozwinięcie tematyki bloga: od optymalizacji składni (*Class Helpers*), przez techniki refaktoryzacji (*Introduce Parameter Object*), aż po **architekturę narzędzi automatyzujących jakość kodu**.
2. Rozwiązuje rzeczywisty, techniczny problem, z którym boryka się każdy autor narzędzi w Object Pascalu (problem stratności parsera i obecności dyrektyw kompilatora).
3. Posiada czytelny, zwięzły kod architektoniczny, który idealnie mieści się w formacie artykułu technicznego.
