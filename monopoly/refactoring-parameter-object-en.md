---
postId: safe-refactoring-parameter-object
language: en
date: 2026-03-23
author: "Bogdan Polak"
title: "Safe Refactoring with the Introduce Parameter Object Pattern"
description: "How to safely replace several parameters with a single object so the code becomes easier to manage."
coverImage: "images/refactoring-parameter-object.png"
coverImageCaption: "Monopoly-inspired illustration of safely replacing multiple parameters with a single object in public function interfaces"
intro: "Refactoring can feel risky, especially when you work with code where state is spread across many arguments and business logic is split between multiple modules. A practical way to reduce that risk is to group related arguments into a single context object and migrate call sites in small, verified steps. In this article, we will examine that idea using a Monopoly example and show how to apply the `Introduce Parameter Object` pattern in a legacy codebase."
---

# Safe Refactoring with the Introduce Parameter Object Pattern

## Motivation

Refactoring can feel risky, especially in code that is not well protected by unit tests, which is why the standard recommendation is to build a dense safety net of tests. However, for some refactorings, such as `Introduce Parameter Object`, a large number of tests can actually make migration harder because public function interfaces change in a meaningful way. That can break many tests at once and reduce trust in the test suite.

As a result, many developers may feel discouraged from using this pattern. However, experts such as Martin Fowler and Robert C. Martin agree that it is a key refactoring that can significantly improve maintainability. In Clean Code, Robert C. Martin defines several attributes of a clean function. One of them concerns the number of parameters:

> Function Arguments: The ideal number of arguments for a function is Zero. Next comes One, followed closely by Two. Three arguments should be avoided where possible. More than three is intolerable. Most of the cases, they can be extracted into a class. --- **Robert C. Martin** - Clean Code: A Handbook of Agile Software Craftsmanship, 2008.

In Refactoring, Martin Fowler describes the code smell associated with too many parameters:

> Data Clumps: This is one of my favorite CodeSmells from the refactoring book. You spot it when you constantly see the same few data items passed around together. start and end are a good example of a data clump wanting to be a range. Often data clumps are primitive values that nobody thinks to turn into an object. --- **Martin Fowler** - Refactoring: Improving the Design of Existing Code, 2016.

In this article, I want to show skeptical readers how to introduce this pattern safely, even in code that already has a dense network of unit tests. I will use a practical Monopoly example to illustrate the process. Introducing this pattern is a bit like a technique used in civil engineering called a diversion channel. It creates a safe construction zone while the main structure is being rebuilt. During code migration, we temporarily keep both the old and the new public interfaces in place. That works like a diversion channel that redirects traffic from one route to another while the old route is gradually closed.

![figure: To build a dam on a river, engineers create a temporary diversion channel that redirects the water around the construction site.](./images/diversion-channel.png)

## Pattern: Introduce Parameter Object

As mentioned earlier, this pattern is an important tool in the refactoring toolbox. It improves readability and cohesion by grouping related parameters into a single object. It is especially useful when you have a function or method that accepts many parameters.

The pattern was introduced by Martin Fowler. He encourages its use especially when you see a function or method that takes several parameters, usually more than two, that:

- often appear together
- belong to one logical context
- make the function signature hard to understand
- force repeated multi-line data setup in tests, especially in the arrange section

The Data Clumps smell causes a general decline in code quality. It scatters knowledge about operations across multiple modules, which makes the code harder to evolve and bugs harder to fix. The `Introduce Parameter Object` pattern addresses that smell by creating a clear boundary for related data and operations. When you find a function with these weaknesses and it also plays an important role in the project, you have probably found a strong candidate for this refactoring.

![figure: A gray cat struggles to hold a stack of loose cards and looks overwhelmed. An orange cat has organized its cards and points to a tidy house labeled "Database Connection Class," where all the cards are grouped together.](./images/introduce-parameter-object.png)

There are many other design patterns and refactorings that can improve code, but in this article I will focus only on `Introduce Parameter Object` and the related `Data Clumps` smell.

## Monopoly - illustrating the problem

I will illustrate the problem with a practical example from a JavaScript project that powers a digital version of the Monopoly board game.

Before the refactoring started, the project had several functions that accepted between two and four related arguments, such as `players` and `board`. At the same time, functions operating on game state were spread across different files and modules. That made the state and the core logic harder to understand and modify.

- Game state was split across several separate values:
  - `players` - an array of player objects, each with its own properties such as `position`, `isBankrupt`, `id`, and so on
  - `board` - an array representing the board, where each element is a tile with properties such as `type`, `name`, `price`, and so on
  - `currentPlayerId` - the identifier of the current player
  - `currentDiceRoll` - the most recent dice roll
- Functions operating on game state were spread across multiple modules:
  - `rollDice()` - a function responsible for simulating a dice roll, used in many places but not tied to any specific game object
  - `currentPlayer(players, currentPlayerId)` - a function that returned the current player based on `currentPlayerId`, but was defined in a different module from the player-related functions
  - `activePlayers(players)` - a function that returned the list of active players
  - `countActivePlayers(players)` - a function that counted active players
  - `nextActivePlayer(players, playerId)` - a function that returned the next active player
- Key game logic lived in functions that accepted different combinations of those values:
  - `movePlayer()` - movement logic on the board, and the main place where the Data Clumps smell appeared
  - `processLocationRules()` - rules for handling the newly reached location
  - `processPayRentRules()` - rules for paying rent after landing on another player's property
  - `processBankruptcyRules()` - bankruptcy rules that checked whether the player went bankrupt after each financial operation

Initially, the main game loop looked like this. It is simplified for illustration and does not represent the exact implementation:

```js
const board = createBoard();
const players = createPlayers([
  "Luke Skywalker",
  "Darth Vader",
  "Han Solo",
  "Leia Organa",
]);

showIntro(players);

let player = nextActivePlayer(players, currentPlayerId);
while (player !== null) {
  let doublesCount = 0;
  let hasDouble = true;
  while (hasDouble && doublesCount < 3 && !player.isBankrupt) {
    const roll = rollDice();

    movePlayer(player, board, players, roll.total);

    hasDouble = roll.isDouble;
    if (hasDouble) {
      doublesCount++;
    }
  }
  player = nextActivePlayer(players, currentPlayerId);
}

showSummary(players);
```

This simplified version shows the structure of the problem, but the data and functions it relies on are scattered. If you want to change how active players are tracked, how turns are ordered, or how utilities and railroads are handled, you need to touch several places at once.

Problems that are already visible from the outside become much worse inside `movePlayer()`. It takes four parameters: `player`, `board`, `players`, and `rollTotal`, and it contains a lot of crucial game rules, such as going to jail, checking whether the player is bankrupt, and deciding whether the player landed on someone else's property and must pay rent. This is a large function with too many responsibilities, and even in its current state it is hard to understand and modify. As the project grows, this area can only get worse. An early design shortcut, keeping game state in many separate values, makes it much harder to introduce changes such as a flexible rules system that follows the Open-Closed Principle from SOLID.

## Architectural comment

I already mentioned the Open-Closed Principle, but there is another SOLID principle that matters a lot for this refactoring: the Single Responsibility Principle.

SRP says that a class should not become too large and, more precisely, that it should have only one reason to change. In the Monopoly context, a `game` object should be responsible for managing game state. It is very easy to violate SRP with an object like this because it may seem natural to put every game-related concern into it, even REST communication or file persistence. Drawing the right boundary takes experience and practice. We should not even put property-purchase rules or rent-payment rules into it. Those responsibilities should live in separate modules or classes.

Look for a boundary that groups closely related values, not a bucket for everything. Keep one key rule in mind: do not push too much into one object. If the boundary grows too wide, narrow the responsibility again, usually by splitting the object into smaller parts. Defining boundaries well is a central part of software design, and many principles address it, including SRP, Separation of Concerns, and Event Storming in Domain-Driven Design. An oversized bucket object with too many responsibilities is commonly known as a God Object, which is an anti-pattern.

## Refactoring step by step

1. **Create the `game` object.**
   - Create a `createGame(playerNames)` function that returns a `game` object with the initial game state, including the player array, the board, the current player, and helper functions for navigating the state.
   - Make sure `createGame()` is well tested so you can trust the shape and behavior of the returned object. This is a critical step because `game` becomes the new boundary for many functions, so it must be stable and well defined.
    ```js
    test("createGame returns expected shape", () => {
      const game = createGame(["Luke", "Leia"]);
      expect(game.players).toHaveLength(2);
      expect(game.currentPlayerId).toBeNull();
      expect(game.board).toBeDefined();
    });
    ```
   - Move to the next step when you have strong tests for `createGame()`.
2. **Introduce the diversion channel.**
   - Create `movePlayer_new()`, but let it delegate internally to the old function so that existing behavior stays intact. This lets you migrate calls to `movePlayer` gradually without immediately breaking the test suite.
    ```js
    function movePlayer_new(game) {
      movePlayer(
        game.currentPlayer(),
        game.board,
        game.players,
        game.currentDiceRoll.total
      );
    }
    ```
   - Move to the next step when you have verified that `movePlayer_new()` works correctly in at least one test.
3. **Update the tests.**
   - Update the `movePlayer` tests to use `movePlayer_new(game)`. Estimate the size of the migration. If it will take longer, keep both test variants in place and migrate them gradually, one by one.
   - Run the tests often to make sure they still pass. Enabling watch mode helps here.
    ```js
    test("movePlayer - Obi-Wan passes Start and buys a property", () => {
      const game = createTestGame([
        // Obi-Wan starts at Pacific Avenue with $1500
        { name: "Obi-Wan", position: 31 },
      ]);
      game.currentDiceRoll = { total: 10 };

      movePlayer_new(game);

      // Obi-Wan passes Start and lands on Mediterranean Avenue:
      // - collects $200 for passing Start
      // - buys Mediterranean Avenue for $60
      assert.equal(game.players[0].position, 1);
      assert.equal(game.players[0].money, 1500 + 200 - 60);
    });
    ```
   - Move to the next step when all tests pass.
4. **Migrate production calls.**
   - Update all calls from `movePlayer(player, board, players, steps)` to `movePlayer_new(game)`. Again, if the migration is large, keep both variants and move gradually, running tests after each change.
   - To make progress easier to track, you can rename the old function to `movePlayer_old()` so it is always clear which version is still used in production code.
   - Move the full implementation of player movement into `movePlayer_new()`. That lets you gradually remove the dependency on the old function.
   - When finished, make sure all tests still pass.
   - Remove the old `movePlayer_old()` function and any obsolete tests.
   - Rename `movePlayer_new()` back to `movePlayer()`.

Changing everything at once would be risky and could easily damage the test suite, miss a critical scenario, or introduce production bugs. A safer path is this:

1. Keep the old behavior intact until the very end of the migration.
2. Add a temporary adapter that delegates to the old function.
3. Migrate tests gradually.
4. Collapse the production code into the final `movePlayer(game)` form.

The `movePlayer_new` adapter is not the goal. It is only a migration aid. You introduce it to preserve behavior while callers move from the old function signature to the new one. That is why the diversion channel is such a useful metaphor. It gives you a dry construction zone where you can make changes safely and then gradually move traffic from the old route, the old function signature, to the new route, the new function signature. Once all traffic is on the new route, the old one can be removed and the new one becomes the only path forward.

## Example of `createGame` and the adapter

This is what the new project boundary around the game object can look like:

```js
export function createGame(playerNames) {
  const players = createPlayers(playerNames);

  return {
    currentPlayerId: null,
    currentDiceRoll: null,
    players,
    board: createBoard(),
    rollDice() {
      const roll = rollDice();
      this.currentDiceRoll = roll;
      return roll;
    },
    currentPlayer() {
      return this.players.find((player) => player.id === this.currentPlayerId) ?? null;
    },
    getActivePlayers() {
      return this.players.filter((player) => !player.isBankrupt);
    },
    countActivePlayers() {
      return this.getActivePlayers().length;
    },
    nextActivePlayer() {
      const activePlayers = this.getActivePlayers();

      if (activePlayers.length < 2) {
        this.currentPlayerId = null;
        return false;
      }

      const player = this.currentPlayer();
      if (player === null) {
        this.currentPlayerId = activePlayers[0].id;
      } else {
        const index = activePlayers.findIndex((activePlayer) => activePlayer.id === player.id);
        const nextIndex = (index + 1) % activePlayers.length;
        this.currentPlayerId = activePlayers[nextIndex].id;
      }

      return true;
    },
  };
}
```

## Final advice

The `Introduce Parameter Object` pattern may be expensive to introduce, but it pays back with every change that comes later.

Practicing refactoring is part of what separates a good engineering team from an average one. A strong team lead should encourage developers to refactor, which in turn means investing time in a solid unit test suite. Missing or weak tests are a common reason why teams avoid refactoring, which then leads to declining code quality and fast-growing technical debt. Large technical debt reduces team productivity and morale, and in extreme cases it leads to rewriting the whole project in a supposedly better technology. That is expensive, risky, and rarely delivers the expected results, because the same team often repeats the same mistakes, while a brand new team may lack the domain knowledge and experience needed to do better.

On the other hand, designing in advance for every future need is very difficult in practice, and often impossible. When we design a system, we do not have complete knowledge of future requirements, and even if we think we do, those requirements may still change. That is why it is so important to have tools and techniques for introducing change safely. Their purpose is to improve code quality and make the system easier to maintain over time.

Refactoring is not a rigid set of rules. It is a set of practical guidelines that require adaptation and judgment. They help developers make conscious decisions while transforming weak code. In the case of `Introduce Parameter Object`, the key principle is to avoid creating a boundary that is too broad. Do not try to move the entire game state into one `game` object all at once, because that can lead directly to a God Object that is hard to understand and maintain.

When code changes look risky, do not start by redesigning the entire system. Use this decision tree instead:

1. **Do you have strong unit tests?** If not, build them first.
2. **Can you introduce a temporary adapter that delegates to the old function?** If not, the scope is still too large, so split it further.
3. **Can you migrate tests one by one?** If not, the scope is still too large, so split it further.

If you can answer yes to all three, you are probably ready to refactor safely.

## References

1. Martin Fowler - Refactoring: Improving the Design of Existing Code. https://martinfowler.com/books/refactoring.html
2. Robert C. Martin - Clean Code: A Handbook of Agile Software Craftsmanship. https://www.goodreads.com/book/show/3735293-clean-code
3. Martin Fowler - Data Clump Code Smell. https://martinfowler.com/bliki/DataClump.html
4. SOLID principles - Wikipedia. https://en.wikipedia.org/wiki/SOLID
5. Refactoring Guru - Introduce Parameter Object. https://refactoring.guru/introduce-parameter-object/
6. Refactoring Guru - Data Clumps. https://refactoring.guru/smells/data-clumps/
7. Refactoring Guru - Large Class. https://refactoring.guru/smells/large-class