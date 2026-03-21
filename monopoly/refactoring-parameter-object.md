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
movePlayer(player, steps, board, players);
```

you group them into one focused context object:

```js
movePlayer(game, steps);
```

Think of `game` not as a bucket for everything, but as a boundary: it groups values that already belong together and exposes only the behavior callers need.

This does not automatically change the business rules. It changes the shape of the input so the code becomes easier to migrate, easier to test, and easier to extend later.

## What This Refactoring Actually Is

The most accurate name for this change is [`Introduce Parameter Object`](https://refactoring.guru/introduce-parameter-object).

It is a refactoring described by [Martin Fowler](https://martinfowler.com/books/refactoring.html). It is useful when several arguments:

- often appear together
- belong to one logical context
- make function signatures noisy
- create repeated setup in tests and callers

It also helps with a common code smell: [`Data Clump`](https://refactoring.guru/smells/data-clumps).

If you often see the same arguments traveling together, that is usually a signal that they belong to one concept.

In this Monopoly project, that concept is `game`.

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

## What Breaks If You Skip This

The scattered-arguments style does not fail immediately. It accumulates cost.

In this project, adding a bankruptcy check was a practical example. Without a centralized `game` object, `isBankrupt` had to be checked in at least three places: inside `playRound` when counting active players, inside `movePlayer` when choosing who acts next, and in two test helpers that had to assemble the same `players` array setup by hand.

One logical rule — skip bankrupt players — touched four files. Each touch was a potential mismatch.

With `game.countActivePlayers()` and `game.getActivePlayers()` in one place, the rule lives once and the test verifies it once.

## Why This Refactor Is Safe

Safe refactoring is not about making one giant change.

It is about making one small verified change at a time.

In this project, the safe sequence is:

**Step 1 — Create `createGame(playerNames)` and verify its shape in isolation.**

```js
test("createGame returns expected shape", () => {
  const game = createGame(["Luke", "Leia"]);
  expect(game.players).toHaveLength(2);
  expect(game.currentPlayerId).toBeNull();
  expect(game.board).toBeDefined();
});
```

Nothing else changes here. The existing `playRound(players, board)` still runs.

**Step 2 — Change `movePlayer()` to `movePlayer(game, steps)`.**

Update the function signature and its internal references. Run the `movePlayer` tests before touching anything else.

```js
// Before
function movePlayer(player, steps, board, players) { ... }

// After
function movePlayer(game, steps) {
  const player = game.currentPlayer();
  ...
}
```

**Step 3 — Change `playRound()` to `playRound(game)`.**

Run the `playRound` tests. At this point, `index.js` still uses the old signatures — that is intentional. Failing here is a narrow signal.

**Step 4 — Update `index.js`.**

Replace:

```js
const board = createBoard();
let players = createPlayers(["Luke Skywalker", "Darth Vader"]);
playRound(players, board);
```

With:

```js
const game = createGame(["Luke Skywalker", "Darth Vader"]);
playRound(game);
```

**Step 5 — Migrate `locationRules` with a temporary adapter.**

See the next section for what this looks like in practice.

**Step 6 — Run the full test suite.**

Only after each focused slice is stable. A failure at this point points to a specific step, not an unknown cause.

This keeps failures narrow. When a test fails, the recent change is small enough to reason about quickly.

## Code Sample Adapted To This Project

Here is what the new object boundary looks like.

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

The adapter is not the destination. It is a migration aid. Its job is to preserve behavior while callers move from the old function signature to the new one.

Here is what that adapter looks like in practice:

```js
// Original function — unchanged, still tested
function handle(player, tile, board, players) {
  // existing location rule logic
}

// Temporary adapter — accepts game, delegates to old signature
function handleWithGame(game) {
  const player = game.currentPlayer();
  const tile = game.board[player.position];
  return handle(player, tile, game.board, game.players);
}
```

Callers migrate to `handleWithGame(game)` one at a time. Once all callers are migrated and tests pass, the adapter is collapsed:

```js
// Final form — old signature removed
function handle(game) {
  const player = game.currentPlayer();
  const tile = game.board[player.position];
  // location rule logic using game directly
}
```

This works because behavior never changes mid-migration. The adapter ensures the old logic runs unchanged until the new boundary is fully verified.

## Why Tests Get Better

Before the refactor, a test often had to build and coordinate several values:

```js
const board = createBoard();
const players = createPlayers(["Luke", "Leia"]);
const player = players[0];

movePlayer(player, 2, board, players);
expect(player.position).toBe(2);
```

During the migration, this test breaks immediately when `movePlayer` adopts the new signature. That failure is useful — it tells you exactly which test files still depend on the old shape.

After migrating the test, the setup becomes more direct:

```js
const game = createGame(["Luke", "Leia"]);
game.currentPlayerId = game.players[0].id;

movePlayer(game, 2);
expect(game.currentPlayer().position).toBe(2);
```

That is easier to read because the test expresses intent more clearly. It also reduces repeated setup noise across multiple test files — `createGame` replaces the three-line board/players/player assembly that appeared in every test.

## A Good Mental Model

Do not think of `game` as a bucket for everything.

Think of it as a focused context object.

That means:

- it groups values that already belong together
- it exposes the smallest useful behavior for callers
- it reduces how much every caller needs to know

This is also where discipline matters. A context object is helpful when it clarifies responsibilities. It becomes harmful when it turns into a vague "object with everything inside".

A practical signal: if adding a new field to `game` makes you uncomfortable because you are unsure what else will break, the object has grown too large. The right response is to split it, not to keep packing things in.

## What Comes Next

Once state is centralized behind `game`, the next natural step is moving behavior into the object itself.

For example, `executePlayerTurn(game)` could become `game.executePlayerTurn()`. That is a separate refactoring — [Replace Function with Command](https://refactoring.guru/replace-method-with-method-object) or moving behavior closer to the data it depends on.

The reason to do `Introduce Parameter Object` first is that it makes that next move much smaller. You are not reorganizing scattered state — you are just relocating a method to an object that already owns the relevant data.

## Practical Rule Of Thumb

When code feels risky, do not start by redesigning the whole system.

Instead, use this decision tree:

1. **Do the same arguments travel together across multiple functions?** If no, they may not belong in one object — do not force it.
2. **Do they represent one logical concept?** If yes, name that concept and create an object for it.
3. **Can you migrate one function signature at a time?** If no, the scope is too large — split it further.
4. **Can you write a focused test for each step?** If no, you do not yet understand the boundary well enough to move it.

If you reach step 4 with yes answers, you already have a strong path for safe refactoring.

## References

1. Martin Fowler - Refactoring: Improving the Design of Existing Code. https://martinfowler.com/books/refactoring.html.
2. Refactoring Guru - Introduce Parameter Object. https://refactoring.guru/introduce-parameter-object.
3. Refactoring Guru - Data Clumps. https://refactoring.guru/smells/data-clumps.
4. Refactoring Guru - Replace Function with Command. https://refactoring.guru/replace-method-with-method-object.

## Closing Thought

`Introduce Parameter Object` earns its value not in the moment you apply it, but in every change that comes after.

It gives the code a clearer boundary, reduces repeated setup, and narrows the blast radius of future edits. That is what makes it a reliable first step — not just a cleanup, but a foundation for the refactoring that follows.
