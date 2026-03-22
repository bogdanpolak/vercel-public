---
postId: safe-refactoring-parameter-object
language: pl
date: 2026-03-23
author: "Bogdan Polak"
title: "Bezpieczna refaktoryzacja z Introduce Parameter Object"
description: "Jak w sposób bezpieczny zastąpić wiele parametrów jednym obiektem, tak aby kod był łatwiejszy w zarządzaniu."
coverImage: "images/002-cover-image.png"
coverImageCaption: "Ilustracja inspirowana grą Monopoly, bezpieczne zastąpienie wielu parametrów jednym obiektem w publicznych funkcjach"
intro: "Refaktoryzacja może wydawać się ryzykowna, zwłaszcza gdy pracujesz z kodem, w którym stan jest rozproszony na wiele argumentów, a logika biznesowa zapisana w  wielu modułach. Praktycznym sposobem na zmniejszenie tego ryzyka jest grupowanie powiązanych argumentów w jeden obiekt kontekstu i migracja wywołań w małych, weryfikowanych krokach. W tym artykule przeanalizujemy tę ideę na przykładzie gry planszowej Monopoly i pokażemy, jak w praktyce zastosować wzorzec `Introduce Parameter Object` w zastanym kodzie."
---

# Bezpieczne wprowadzenie Introduce Parameter Object

## Motywacja

Refaktoryzacja może wydawać się ryzykowna, w kodzie słabo zabezpieczonym testami jednostkowymi, dlatego ogólnie znanym zaleceniem jest wprowadzanie gęstej siatki testów. Jednak w przypadku niektórych refaktoryzacji, takich jak `Introduce Parameter Object`, duża ilość testów może znacznie utrudnić migrację, ponieważ w istotny sposób zmieniane są interfejsy funkcji publicznych. To może prowadzić do przypadkowego uszkodzenia wielu testów, czyli do utraty zaufania do testów.

Stąd wielu programistów może być zniechęconych do tego wzorca, jednak eksperci, tacy jak Martin Fowler i Robert C. Martin, zgadzają się, że jest to kluczowa refaktoryzacja, która może znacznie poprawić łatwość konserwacji kodu. Robert C. Martin w książce Clean Code definiuje wiele aspektów czystej funkcji, jeden z nich dotyczy liczby parametrów:

> Parametry Funkcji: Idealna liczba argumentów dla funkcji to Zero. Następnie jeden, a tuż za nim dwa. Trzy argumenty powinny być unikane, gdzie to możliwe. Więcej niż trzy jest nie do zaakceptowania. W większości przypadków mogą być wyekstrahowane do klasy. --- **Robert C. Martin** - Clean Code: A Handbook of Agile Software Craftsmanship, 2008.

Martin Fowler w książce Refactoring definiuje zapaszek kodu (ang. Code Smell) związany ze zbyt dużą liczbą parametrów:

> Data Clumps: Kępy Danych to jeden z moich ulubionych zapachów kodu. Zauważysz go, gdy po raz kolejny widzisz te same dane przekazywane razem. Dobrym przykładem są start i end w zakresie dat. Rozwiązaniem jest zastosowanie klasy Range. Często Data Clumps to wartości prymitywne, o których nikt nie myśli jako o obiekcie. --- **Martin Fowler** - Refactoring: Improving the Design of Existing Code, 2016.

Dlatego w tym artykule spróbuję przekonać niechętnych, jak w bezpieczny sposób wprowadzić ten wzorzec, nawet w kodzie, który ma gęstą sieć testów jednostkowych. Dalej w tym artykule będę używać praktycznego przykładu z gry planszowej Monopoly, w celu ilustracji procesu. Wprowadzanie tego wzorca przypomina trochę technikę znaną w inżynierii lądowej, nazywaną "kanałem dywersyjnym" (ang. diversion channel). Jest ona sposobem na bezpieczne prowadzenie przebudowy (ang. dry construction zone = bezpieczna strefa budowy). W czasie migracji kodu będziemy korzystać z dwóch wersji interfejsów funkcji publicznych starej i nowej, co przypomina tymczasowy kanał dywersyjny, który przekierowuje ruch z jednej trasy na drugą, podczas gdy stara trasa jest stopniowo zamykana.

![figure: Aby zbudować tamę na rzece, inżynierowie tworzą tymczasowy kanał dywersyjny, który kieruje wodę wokół miejsca budowy.](./images/002-diversion-channel.png)

## Wzorzec: Introduce Parameter Object

Jak już wspomniano wcześniej, ten wzorzec jest istotnym narzędziem w arsenale refaktoryzacji, który pomaga poprawić czytelność i spójność kodu poprzez grupowanie powiązanych parametrów w jeden obiekt. Jest to szczególnie przydatne, gdy masz funkcję lub metodę, która przyjmuje wiele parametrów.
 
Wzorzec został wprowadzony przez Martina Fowlera. Autor zachęca aby stosować go szczególnie w sytuacjach, gdy oglądając kod widzisz funkcję/metodę, która przyjmuje kilka parametrów (więcej niż dwa), które:

- często pojawiają się razem
- należą do jednego logicznego kontekstu
- powodują, że sygnatura funkcji jest trudna do zrozumienia
- powodują powtarzającą się wieloliniową sekcję przygotowania danych w testach (sekcja: "arrange")

Opisany problem Kęp Danych wywołuje ogólną degradację jakości kodu. Rozprasza wiedzę o operacjach między różnymi modułami, co utrudnia rozwój kodu i naprawę wykrytych błędów. Wzorzec `Introduce Parameter Object` pomaga rozwiązać problem tego zapachu kodu, tworząc jasną granicę dla powiązanych danych i operacji/funkcji. Gdy zobaczysz funkcję, która ma takie słabości, a przy tym ma krytyczne znaczenie w Twoim projekcie, to właśnie znalazłeś dobrego kandydata na wprowadzenie tego wzorca.

![figure: Szary kot z trudnością utrzymuje stos luźnych kart i wygląda na przytłoczonego. Z kolei pomarańczowy kot uporządkował swoje karty i wskazuje na schludny domek "Database Connection Class", gdzie wszystkie karty są zgrupowane razem.](./images/002-database-object.png)

Istnieje wiele innych wzorców projektowych i refaktoryzacji, które mogą pomóc w ulepszeniu kodu, jednak w tym artykule skupimy się tylko na wzorcu `Introduce Parameter Object` i związanym z nim zapachem `Data Clumps`.

## Gra Monopoly - ilustracja problemu

Zilustruję powyższy problem kodu praktycznym przykładem z projektu Delphi obsługującego cyfrową wersję gry planszowej Monopoly.

Przed rozpoczęciem refaktoryzacji projekt miał kilka funkcji i procedur, które przyjmowały od 2 do 4 powiązanych ze sobą argumentów, takich jak `Players`, `Board`. Równocześnie kod operujący na stanie gry znajdował się w różnych unitach. Taka sytuacja powodowała, że stan gry i logika były trudne do zrozumienia i modyfikacji.

- Stan gry był rozproszony na kilka odrębnych wartości:
  - `Players` - lista obiektów graczy, z których każdy ma własne właściwości, takie jak `Position`, `IsBankrupt`, `Id` itp.
  - `Board` - obiekt reprezentujący planszę, zawierający pola z parametrami takimi jak `TileType`, `Name`, `Price` itp.
  - `CurrentPlayerId` - identyfikator bieżącego gracza
  - `CurrentDiceRoll` - wynik ostatniego rzutu kośćmi
- funkcje operujące na stanie gry były rozproszone w kilku modułach:
  - `RollDice()` - funkcja odpowiedzialna za symulację rzutu kośćmi, która była używana w wielu miejscach, ale nie była powiązana z żadnym konkretnym obiektem gry
  - `CurrentPlayer(const APlayers: TObjectList<TPlayer>; APlayerId: Integer)` - funkcja, która zwracała bieżącego gracza na podstawie `CurrentPlayerId`, ale była zdefiniowana w innym unicie niż kod operujący na graczach
  - `GetActivePlayers(const APlayers: TObjectList<TPlayer>)` - funkcja, która zwracała listę aktywnych graczy
  - `CountActivePlayers(const APlayers: TObjectList<TPlayer>)` - funkcja, która zliczała aktywnych graczy
  - `NextActivePlayer(const APlayers: TObjectList<TPlayer>; APlayerId: Integer)` - funkcja, która zwracała następnego aktywnego gracza
- kluczowa logika gry zapisana w funkcjach przyjmujących różne kombinacje powyższych wartości jako argumenty:
  - `MovePlayer()` - logika ruchu po planszy (tutaj pojawił się zapach Kęp Danych)
  - `ProcessLocationRules()` - reguły lądowania w nowej lokalizacji
  - `ProcessPayRentRules()` - reguły płacenia czynszu po wylądowaniu gracza na czyjejś własności
  - `ProcessBankruptcyRules()` - reguły bankructwa, które sprawdzały, czy gracz jest bankrutem po każdej operacji finansowej

Początkowo główna pętla gry wyglądała tak (uproszczona dla celów ilustracyjnych, nie jest to dokładna implementacja):

```pascal
procedure RunGame;
var
  Board: TBoard;
  Players: TObjectList<TPlayer>;
  Player: TPlayer;
  Roll: TDiceRoll;
  CurrentPlayerId: Integer;
  DoublesCount: Integer;
  HasDouble: Boolean;
begin
  Board := CreateBoard;
  Players := CreatePlayers([
    'Luke Skywalker',
    'Darth Vader',
    'Han Solo',
    'Leia Organa'
  ]);
  try
    ShowIntro(Players);

    Player := NextActivePlayer(Players, CurrentPlayerId);
    while Assigned(Player) do
    begin
      DoublesCount := 0;
      HasDouble := True;

      while HasDouble and (DoublesCount < 3) and not Player.IsBankrupt do
      begin
        Roll := RollDice;
        MovePlayer(Player, Board, Players, Roll.Total);

        HasDouble := Roll.IsDouble;
        if HasDouble then
          Inc(DoublesCount);
      end;

      Player := NextActivePlayer(Players, CurrentPlayerId);
    end;

    ShowSummary(Players);
  finally
    Players.Free;
    Board.Free;
  end;
end;
```

Ta wersja działa, ale dane i funkcje przez nią używane są rozproszone. Jeśli chcesz zmienić śledzenie listy aktywnych graczy, porządek tur lub reguły dotyczące obsługi wodociągów i zakładu energetycznego, musisz dotknąć kilku miejsc na raz.

Problemy widoczne już na zewnątrz stają się o wiele poważniejsze wewnątrz funkcji `MovePlayer()`. Przyjmuje ona 4 parametry: `APlayer`, `ABoard`, `APlayers` i `ARollTotal`, a do tego zawiera dużo kluczowych reguł gry, takich jak: pójście do więzienia, sprawdzenie, czy gracz jest bankrutem, sprawdzenie, czy gracz wylądował na czyjejś własności i musi zapłacić czynsz itd. To jest duża funkcja z wieloma odpowiedzialnościami, która nawet w aktualnym stanie była trudna do zrozumienia i modyfikacji. Wraz z rozwojem projektu w tym miejscu może być tylko gorzej. Pochopna decyzja podjęta na początku projektowania gry, czyli trzymanie stanu gry na wielu odrębnych wartościach, utrudnia wprowadzanie zmian, takich jak elastyczny system reguł gry, który spełnia regułę Otwarte-Zamknięte (ang. Open-Closed Principle) z zasad SOLID.

## Komentarz architektoniczny

Powyżej wspomniałem już o zasadzie Open-Closed (OCP), ale jest jeszcze jedna ważna zasada w SOLID, która jest kluczowa dla tej refaktoryzacji, a mianowicie zasada Single Responsibility Principle (SRP). 

Zasada SRP mówi, że klasa tego typu nie może być zbyt duża, a dokładniej, powinna mieć tylko jedną odpowiedzialność, czyli powinna być odpowiedzialna za tylko jeden aspekt funkcjonalności systemu. W kontekście gry Monopoly obiekt `TGame` powinien być odpowiedzialny za zarządzanie stanem gry. W przypadku takiej klasy bardzo łatwo jest naruszyć zasadę SRP, bo wydaje się, że obiekt gry powinien zawierać wszystkie aspekty gry, nawet komunikację z serwerem REST lub zapisywanie danych do pliku. Dobre podzielenie granicy wymaga doświadczenia i wieloletniej praktyki. Nie powinniśmy dodawać do niego nawet reguł kupowania własności czy płacenia czynszu. Zadaniami tymi powinny zająć się osobne moduły lub klasy.

 Poszukaj granicy separującej blisko zaprzyjaźnione wartości, a nie o "wiadrze na wszystko". Pamiętaj o kluczowej zasadzie: nie wrzucaj zbyt wiele do jednego obiektu. Jeśli granica została za mocno rozszerzona, powinniśmy odpowiedzialność klasy zawęzić, zazwyczaj dzieląc obiekt na mniejsze części. Temat ustalania granic jest bardzo ważny dla projektowania systemów i opisuje go wiele reguł, takich jak omawiana teraz zasada SRP lub inne: Separation of Concerns, czy Event Storming w Domain-Driven Design. Taki obiekt "wiadro", zawierający zbyt wiele odpowiedzialności, nazywany jest boskim obiektem (ang. God Object) i jest antywzorem projektowym.

## Refaktoryzacja krok po kroku

1. **Tworzenie obiektu `TGame`.**
   - Utwórz klasę `TGame` oraz prostą funkcję fabrykującą `CreateGame(const APlayerNames: array of string): TGame`, która zwraca obiekt z początkowym stanem gry, w tym listą graczy, planszą, bieżącym graczem i metodami pomocniczymi do nawigacji po stanie gry.
   - Upewnij się, że `CreateGame()` jest dobrze przetestowane, aby mieć pewność, że zwraca obiekt o oczekiwanym kształcie i zachowaniu. To jest kluczowy krok, ponieważ `TGame` będzie nową granicą dla wielu funkcji, więc ważne jest, aby był stabilny i dobrze zdefiniowany.
    ```pascal
    [Test]
    procedure TGameFactoryTests.CreateGame_ReturnsExpectedShape;
    var
      Game: TGame;
    begin
      Game := CreateGame(['Luke', 'Leia']);
      try
        Assert.AreEqual(2, Game.Players.Count);
        Assert.AreEqual(-1, Game.CurrentPlayerId);
        Assert.IsNotNull(Game.Board);
      finally
        Game.Free;
      end;
    end;
    ```
    - Przejdź do kolejnego kroku, gdy masz silne testy dla `CreateGame()`.
2. **Wprowadzenie kanału dywersyjnego.**
   - Stwórz `MovePlayerNew()`, ale wewnętrznie deleguj do starej funkcji, aby zachować istniejące zachowanie. To pozwala na stopniową migrację wywołań `MovePlayer` bez natychmiastowego uszkadzania systemu testowego.
    ```pascal
    procedure MovePlayerNew(AGame: TGame);
    begin
      MovePlayer(
        AGame.CurrentPlayer,
        AGame.Board,
        AGame.Players,
        AGame.CurrentDiceRoll.Total);
    end;
    ```
    - Przejdź do kolejnego kroku, gdy upewnisz się, że `MovePlayerNew` działa poprawnie w jednym z testów.
3. **Zaktualizuj testy**
    - Zaktualizuj testy `MovePlayer` do używania `MovePlayerNew(Game)`. Oceń rozmiar migracji testów. Jeśli migracja ma potrwać dłużej, pozostaw oba warianty testów, aby je stopniowo migrować jeden po drugim.
    - Często uruchamiaj testy, aby upewnić się, że one nadal przechodzą (włącz automatyczne uruchamianie testów w tzw. trybie "watch").
    ```pascal
    [Test]
    procedure TMovePlayerTests.ObiWanPassesStartAndBuysLocation;
    var
      Game: TGame;
    begin
      Game := CreateTestGame([
        TTestPlayerData.Create('Obi-Wan', 31, 1500)
      ]);
      try
        Game.CurrentDiceRoll := TDiceRoll.Create(10, False);

        MovePlayerNew(Game);

        Assert.AreEqual(1, Game.Players[0].Position);
        Assert.AreEqual(1500 + 200 - 60, Game.Players[0].Money);
      finally
        Game.Free;
      end;
    end;
    ```
    - Przejdź do kolejnego kroku, gdy wszystkie testy przechodzą.
4. **Migracja wywołań w kodzie produkcyjnym.**
   - Zaktualizuj wszystkie wywołania `MovePlayer(APlayer, ABoard, APlayers, ASteps)` do `MovePlayerNew(AGame)`. Ponownie, jeśli migracja jest duża, pozostaw oba warianty i migruj je stopniowo, uruchamiając testy po każdej zmianie.
   - Aby ułatwić śledzenie postępów migracji, możesz zmienić nazwę starej funkcji na `MovePlayerOld()`, aby mieć jasność, która jest aktualnie używana w kodzie produkcyjnym.
   - Przenieś pełną implementację procesowania ruchu gracza do funkcji `MovePlayerNew()`. Pozwoli to na stopniowe usuwanie odwołania do starej funkcji.
   - Po zakończeniu, upewnij się, że wszystkie testy przechodzą.
   - Usuń starą funkcję `MovePlayerOld()` oraz wszystkie stare testy.
   - Zmień nazwę `MovePlayerNew()` z powrotem na `MovePlayer()`.

Zmiana wszystkiego naraz byłaby ryzykowna i łatwo mogłaby doprowadzić do degradacji testów, pominięcia kluczowego scenariusza lub wprowadzenia krytycznych błędów w kodzie produkcyjnym, dlatego bezpieczniejsza ścieżka to:

1. Utrzymaj stare zachowanie do samego końca migracji.
2. Dodaj tymczasowy adapter, wywołujący starą funkcję.
3. Przeprowadź stopniową migrację testów.
4. Zwiń kod produkcyjny do ostatecznej formy `MovePlayer(AGame)`

Adapter `MovePlayerNew` to nie cel, a jedynie pomoc w migracji. Wprowadzasz go, aby utrzymać zachowanie na czas, gdy wywołujący przechodzą ze starej sygnatury funkcji na nową. Dlatego tak dobrą ilustracją tego procesu jest kanał dywersyjny. Dostajemy suchą strefę budowy (ang. dry construction zone), w której możemy bezpiecznie wprowadzać zmiany, a następnie stopniowo przenosić ruch ze starej trasy, czyli starej sygnatury funkcji, na nową. Gdy cały ruch jest już na nowej trasie, stara trasa jest usuwana, a nowa staje się jedyną drogą do celu.

## Przykład TGame i adaptera

Oto jak wygląda nowa granica projektu dla obiektu gry:

```pascal
type
  TGame = class
  private
    FBoard: TBoard;
    FPlayers: TObjectList<TPlayer>;
    FCurrentPlayerId: Integer;
    FCurrentDiceRoll: TDiceRoll;
    function GetCurrentPlayer: TPlayer;
    function IndexOfActivePlayer(const AActivePlayers: TArray<TPlayer>;
      APlayerId: Integer): Integer;
  public
    constructor Create(const APlayerNames: array of string);
    destructor Destroy; override;
    function RollDice: TDiceRoll;
    function GetActivePlayers: TArray<TPlayer>;
    function CountActivePlayers: Integer;
    function TrySelectNextActivePlayer: Boolean;
    property Board: TBoard read FBoard;
    property Players: TObjectList<TPlayer> read FPlayers;
    property CurrentPlayer: TPlayer read GetCurrentPlayer;
    property CurrentPlayerId: Integer read FCurrentPlayerId write FCurrentPlayerId;
    property CurrentDiceRoll: TDiceRoll read FCurrentDiceRoll write FCurrentDiceRoll;
  end;

function CreateGame(const APlayerNames: array of string): TGame;
begin
  Result := TGame.Create(APlayerNames);
end;

constructor TGame.Create(const APlayerNames: array of string);
begin
  inherited Create;
  FPlayers := CreatePlayers(APlayerNames);
  FBoard := CreateBoard;
  FCurrentPlayerId := -1;
  FCurrentDiceRoll := Default(TDiceRoll);
end;

destructor TGame.Destroy;
begin
  FBoard.Free;
  FPlayers.Free;
  inherited;
end;

function TGame.RollDice: TDiceRoll;
begin
  Result := RollDiceCore;
  FCurrentDiceRoll := Result;
end;

function TGame.GetCurrentPlayer: TPlayer;
var
  Player: TPlayer;
begin
  for Player in FPlayers do
    if Player.Id = FCurrentPlayerId then
      Exit(Player);

  Result := nil;
end;

function TGame.GetActivePlayers: TArray<TPlayer>;
var
  Player: TPlayer;
  ActivePlayers: TList<TPlayer>;
begin
  ActivePlayers := TList<TPlayer>.Create;
  try
    for Player in FPlayers do
      if not Player.IsBankrupt then
        ActivePlayers.Add(Player);

    Result := ActivePlayers.ToArray;
  finally
    ActivePlayers.Free;
  end;
end;

function TGame.CountActivePlayers: Integer;
begin
  Result := Length(GetActivePlayers);
end;

function TGame.IndexOfActivePlayer(const AActivePlayers: TArray<TPlayer>;
  APlayerId: Integer): Integer;
begin
  for Result := 0 to High(AActivePlayers) do
    if AActivePlayers[Result].Id = APlayerId then
      Exit;

  Result := -1;
end;

function TGame.TrySelectNextActivePlayer: Boolean;
var
  ActivePlayers: TArray<TPlayer>;
  CurrentIndex: Integer;
begin
  ActivePlayers := GetActivePlayers;
  if Length(ActivePlayers) < 2 then
  begin
    FCurrentPlayerId := -1;
    Exit(False);
  end;

  if CurrentPlayer = nil then
    FCurrentPlayerId := ActivePlayers[0].Id
  else
  begin
    CurrentIndex := IndexOfActivePlayer(ActivePlayers, CurrentPlayer.Id);
    FCurrentPlayerId := ActivePlayers[(CurrentIndex + 1) mod Length(ActivePlayers)].Id;
  end;

  Result := True;
end;
```

## Końcowe porady

Wzorzec `Introduce Parameter Object` może być kosztowny przy wprowadzaniu, ale zwraca się w każdej zmianie, która przychodzi później.

Stosowanie refaktoringu to sztuka, która odróżnia dobry zespół programistów od przeciętnego. Mądry lider zespołu powinien zachęcać programistów do refaktoryzacji. Co pociąga za sobą inwestowanie czasu w silny zestaw testów jednostkowych. Brak lub za słabe testy to częsty powód unikania refaktoryzacji, co dalej prowadzi do degradacji jakości kodu oraz szybkiego gromadzenia długu technicznego. Z kolei duży dług techniczny prowadzi do spadku produktywności zespołu i jego morale, a w skrajnych przypadkach do konieczności przepisania projektu od nowa w "lepszej, wymarzonej technologii", co jest kosztowne, ryzykowne i rzadko kiedy przynosi spodziewane efekty, ponieważ ten sam zespół popełni te same błędy, a zupełnie nowy zespół będzie miał ograniczoną wiedzę dziedzinową i doświadczenie.

Z drugiej strony projektowanie "na zapas" w praktyce jest bardzo trudne, a nawet niemożliwe. W praktyce, gdy projektujemy system, nie mamy pełnej wiedzy o jego przyszłych wymaganiach, a nawet jeśli mamy, to wymagania te mogą się zmieniać w czasie. Dlatego ważne jest, aby mieć narzędzia i techniki do bezpiecznego wprowadzania zmian, które mają pomóc w poprawie jakości kodu i ułatwieniu jego utrzymania w dłuższej perspektywie.

Refaktoryzacja to nie sztywne przepisy, ale raczej praktyczne wskazówki, które wymagają adaptacji i dopasowania. Mają one pomagać programistom podejmować świadome decyzje podczas przekształcania słabego kodu. W przypadku `Introduce Parameter Object`, kluczową zasadą jest unikanie zbyt dużej granicy. Nie próbuj przenosić całego stanu gry do jednego obiektu `game` od razu, ponieważ może to prowadzić do stworzenia boskiego obiektu (ang. God Object), który jest trudny do zrozumienia i utrzymania.

Gdy zmiany kodu wyglądają ryzykownie, nie zaczynaj od przeprojektowania całego systemu. Zamiast tego użyj tego drzewa decyzyjnego:

1. **Czy masz silne testy jednostkowe?** Jeśli nie, najpierw je zbuduj.
2. **Czy możesz wprowadzić tymczasowy adapter, który deleguje do starej funkcji?** Jeśli nie, zakres jest zbyt duży — podziel go dalej.
3. **Czy możesz migrować testy jeden po drugim?** Jeśli nie, zakres jest zbyt duży — podziel go dalej.

Jeśli osiągniesz krok 3 z odpowiedziami "tak" to możesz bezpiecznie przystąpić do refaktoryzacji.

## Odnośniki

1. Martin Fowler - Refactoring: Improving the Design of Existing Code. https://martinfowler.com/books/refactoring.html
2. Robert C. Martin - Clean Code: A Handbook of Agile Software Craftsmanship. https://www.goodreads.com/book/show/3735293-clean-code
3. Martin Fowler - Data Clump Code Smell. https://martinfowler.com/bliki/DataClump.html
4. Zasady SOLID - Wikipedia PL. https://pl.wikipedia.org/wiki/SOLID
5. Refactoring Guru - Introduce Parameter Object. https://refactoring.guru/introduce-parameter-object/
6. Refactoring Guru - Data Clumps. https://refactoring.guru/smells/data-clumps/
7. Refactoring Guru - Large Class. https://refactoring.guru/smells/large-class
