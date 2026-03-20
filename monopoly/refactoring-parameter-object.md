---
postId: safe-refactoring-parameter-object
language: en
date: 2026-03-19
author: "Bogdan Polak"
title: "Safe Refactoring with Introduce Parameter Object"
description: "How grouping related arguments into a game object can make refactoring safer and more manageable."
coverImage: "images/refactoring-parameter-object.png"
coverImageCaption: "A Monopoly-inspired illustration about guiding a refactor step by step with a checklist."
intro: "Refactoring can feel risky, especially when working with code that spreads state across many arguments and many files. One practical way to reduce that risk is to group related arguments into a single context object and migrate callers in small, verified steps. In this article, we will look at that idea through a Monopoly example and show why Introduce Parameter Object is a useful first step in safe refactoring."
---

# Safe Refactoring with Introduce Parameter Object

One of the easiest ways to make a refactor safer is to reduce how many separate values a caller needs to assemble.

That is the core idea behind `Introduce Parameter Object`.

Instead of passing several related arguments:

```js
processLandingLocation(player, tile, board, players);
```

you group them into one object:

```js
processLandingLocation(game);
```

This does not automatically change the business rules. It changes the shape of the input so the code becomes easier to migrate, easier to test, and easier to extend later.

## What This Refactoring Actually Is

The most accurate name for this change is `Introduce Parameter Object`.

It is a refactoring described by Martin Fowler. It is useful when several arguments:

- often appear together
- belong to one logical context
- make function signatures noisy
- create repeated setup in tests and callers

It also helps with a common code smell: `Data Clump`.

If you often see the same arguments traveling together, that is usually a signal that they belong to one concept.

In this Monopoly project, that concept is `game`.

## What This Refactoring Is Not

It is useful to be precise here.

Changing this:

```js
movePlayer(player, steps, board, players);
```

into this:

```js
movePlayer(game, steps);
```

is not a change in game rules.

It is also not a redesign of the whole application.

It is a structural refactor with two main goals:

- reduce argument noise
- centralize related state behind one object

That matters because once state is centralized, later changes become smaller and easier to reason about.

## The Monopoly Example

This project used to spread state across separate values:

- `players`
- `board`
- `rollDice`
- turn flow logic inside `playRound()`
- movement logic inside `movePlayer()`

Earlier style:

```js
const board = createBoard();
let players = createPlayers(["Luke Skywalker", "Darth Vader"]);

showIntro(players);

for (let turn = 0; turn < 10; turn++) {
  playRound(players, board);
}

showSummary(players);
```

That version works, but it spreads knowledge across multiple functions and multiple files. If you want to change current-player tracking, turn order, or active-player rules, you have to touch several places at once.

The refactor introduces a single object:

```js
const game = createGame(["Luke Skywalker", "Darth Vader"]);

showIntro(game.players);

for (let turn = 0; turn < 10; turn++) {
  playRound(game);
}

showSummary(game.players);
```

That gives the code one clearer entry point.

## Why This Change Helps

Before the refactor, movement depended on several separate arguments:

```js
movePlayer(player, steps, board, players);
```

After the refactor, the call becomes:

```js
movePlayer(game, steps);
```

This is a smaller interface for callers.

It also means the caller no longer has to assemble every piece of state manually. The function can retrieve what it needs from one object:

```js
const player = game.currentPlayer();
```

That improves readability and reduces the amount of setup code that has to be repeated across the codebase.

The same idea applies to `playRound(game)`. Once turn-related state lives behind `game`, round execution can depend on:

- `game.currentPlayerId`
- `game.currentPlayer()`
- `game.countActivePlayers()`
- `game.nextActivePlayer()`

That is easier to understand than passing loosely related values around.

## Why This Refactor Is Safe

Safe refactoring is not about making one giant change.

It is about making one small verified change at a time.

In this project, the safe sequence is:

1. create `createGame(playerNames)`
2. verify the game object shape in isolation
3. change the function signature of `movePlayer()` to `movePlayer(game, steps)`
4. change the function signature of `playRound()` to `playRound(game)`
5. update `index.js`
6. migrate `locationRules` with a temporary adapter until `handle(game)` is the final form
7. run the full test suite after the focused slices are stable

This keeps failures narrow. When a test fails, the recent change is small enough to reason about quickly.

## Code Sample Adapted To This Project

Here is a small example of what the new object boundary looks like.

```js
export function createGame(playerNames) {
  const players = createPlayers(playerNames);

  return {
    currentPlayerId: null,
    players,
    board: createBoard(),
    rollDice,
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

      if (activePlayers.length === 0) {
        this.currentPlayerId = null;
        return false;
      }

      if (this.currentPlayerId === null) {
        this.currentPlayerId = activePlayers[0].id;
        return true;
      }

      const currentIndex = activePlayers.findIndex(
        (player) => player.id === this.currentPlayerId,
      );

      if (currentIndex === -1) {
        this.currentPlayerId = activePlayers[0].id;
        return true;
      }

      const nextIndex = (currentIndex + 1) % activePlayers.length;
      this.currentPlayerId = activePlayers[nextIndex].id;
      return true;
    },
  };
}
```

Then `playRound()` becomes simpler:

```js
export function playRound(game) {
  const turnsToPlay = game.countActivePlayers();

  if (turnsToPlay === 0) {
    game.currentPlayerId = null;
    return;
  }

  game.currentPlayerId = null;

  for (let turn = 0; turn < turnsToPlay; turn++) {
    if (!game.nextActivePlayer()) {
      return;
    }

    executePlayerTurn(game);
  }
}
```

The main improvement is not cleverness. The main improvement is that round state and navigation rules now live in one place.

## The Temporary Adapter in Rules Module

The migration of `locationRules` is also important.

Originally, the location logic needed separate values such as:

- `players`
- `board`
- `tile`
- `currentPlayer`

Changing everything at once would be risky, so the safer path is:

1. keep the old behavior available
2. add a temporary adapter that accepts `game`
3. migrate tests to use the game fixture
4. collapse the code to the final `handle(game)` form

The adapter is not the destination. It is a migration aid.

Its job is to preserve behavior while callers move from the old function signature to the new one.

## Why Tests Get Better

Before the refactor, a test often had to build and coordinate several values:

```js
const board = createBoard();
const players = createPlayers(["Luke", "Leia"]);
const player = players[0];

movePlayer(player, 2, board, players);
```

With the refactored boundary, the setup becomes more direct:

```js
const game = createGame(["Luke", "Leia"]);
game.currentPlayerId = game.players[0].id;

movePlayer(game, 2);
```

That is easier to read because the test expresses intent more clearly.

It also reduces repeated setup noise across multiple test files.

## A Good Mental Model

Do not think of `game` as a bucket for everything.

Think of it as a focused context object.

That means:

- it groups values that already belong together
- it exposes the smallest useful behavior for callers
- it reduces how much every caller needs to know

This is also where discipline matters. A context object is helpful when it clarifies responsibilities. It becomes harmful when it turns into a vague "object with everything inside".

## Practical Rule Of Thumb

When code feels risky, do not start by redesigning the whole system.

Start by asking:

1. Which arguments always travel together?
2. Can I group them into one clear object?
3. Can I migrate one function signature at a time?
4. Can I prove each step with a focused test?

If the answer is yes, you already have a strong path for safe refactoring.

## References

1. Martin Fowler - Refactoring: Improving the Design of Existing Code. https://martinfowler.com/books/refactoring.html.
2. Refactoring Guru - Introduce Parameter Object. https://refactoring.guru/introduce-parameter-object.
3. Refactoring Guru - Data Clumps. https://refactoring.guru/smells/data-clumps.

## Closing Thought

`Introduce Parameter Object` is not a flashy change, but it is a very practical one.

It gives the code a clearer boundary, reduces repeated setup, and makes later refactoring steps easier to verify.
