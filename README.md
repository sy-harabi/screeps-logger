# Logger Module

A structured logging module for Screeps, designed to categorize logs by severity and system area.  
It provides detailed logs for different parts of your bot, making debugging and monitoring easier.

## Features

- 📌 **Categorized Logging**: Logs are grouped into categories such as `combat`, `economy`, `defense`, etc.
- 🔍 **Severity Levels**: Supports `fatal`, `error`, `warn`, `info`, `debug`, and `trace` levels.
- 🛠 **Flexible Configuration**: Control verbosity with `setLevel()` and retrieve logs from memory.
- 📧 **Email Notifications**: Automatically notify via email for `WARN` and higher severity logs.
- 🏷 **Room-Specific Logging**: Attach room names to logs for better tracking.
- 🔗 **Automatic Room Links**: If a `roomName` is provided, a hyperlink to the room or room history is included.

---

## Installation

1. Copy `logger.js` to your Screeps project.
2. Import the module:

   ```js
   const logger = require("logger");
   ```

---

## Usage

### 1️⃣ **Basic Logging**

Each log entry is categorized and assigned a severity level.

```js
logger.general.warn("Bucket is below 500");
logger.defense.error("Failed to spawn defender",{ roomName: "W8S1" });
logger.combat.info("Enemy spotted in room W2N3.", { roomName: "W2N3", notify: true });
```

### 2️⃣ **Using Different Categories**
Each category represents a specific aspect of your bot:

```js
logger.economy.info("Created order to sell 30,000 of X");
logger.spawn.debug("Creep spawned: Harvester_1");
logger.movement.trace("Call Pathfinder due to blocking enemy creeps.");
```

### 3️⃣ **Logging with Additional Options**
Providing a `roomName`, enabling notifications, or specifying a `tick`:

```js
logger.general.info("Remote mining start", { roomName: "W8N3" });
logger.defense.warn("Room under attack!", { roomName: "W5N7", notify: true });
logger.spawn.debug("New creep spawned", { tick: Game.time - 5 });
```
📌 **Note:** If a `roomName` is provided, the log will include a hyperlink to the room or its history.

### 4️⃣ **Viewing Logs**
Type these in console to retrieve stored logs from memory and format them for display:

```js
log()
```
You can also filter logs by category:

```js
log("combat");
```

### 5️⃣ **Changing Log Verbosity**
Control how much logging information is shown:

```js
logger.setLevel(3); // INFO level (0 = FATAL, 5 = TRACE)
console.log("Current Log Level:", logger.getLevel());
```

You can also set the logging level in terminal:

```js
setLogLevel(2); // Set logging level to WARN
```

---

## Configuration Variables

### `TIME_OFFSET`
Defines the time zone offset in minutes from UTC. Adjust this value to match your region for correct time formatting in logs. Default value is 540(+09:00)

### `MAX_LOG_NUM`
The maximum number of log entries stored in memory before older logs are overwritten. Default value is 50

### `NOTIFY_INTERVAL`
Specifies the minimum time interval (in ticks) between email notifications for logs marked with `notify: true`. Default value is 60(1 hour)

### `PATH`
Contains URLs for linking logs to different game shards or history pages. This allows logs to provide direct hyperlinks to relevant in-game locations. Seasonal, MMO and sandbox is included by default.

---

## Adding a New Log Category

To add a new log category, modify the `CATEGORY` array in `logger.js`. For example, to add a new `research` category:

```js
const CATEGORY = ["general", "economy", "combat", "defense", "resource", "movement", "events", "spawn", "construct", "research"];
```

This will automatically create `logger.research` with all severity levels (`fatal`, `error`, `warn`, `info`, `debug`, `trace`). You can then use it like:

```js
logger.research.info("New technology researched: Advanced Harvesting");
```

If you need, modify jsdoc for `Logger`

---

## API Reference

### `logger.<category>.<level>(message, options?)`

| Parameter  | Type    | Description                         |
|------------|--------|-------------------------------------|
| `message`  | string | The message to log                 |
| `options`  | object _(optional)_ | Additional log details (see below) |

#### **Available Categories**
- `general` - System-wide messages
- `economy` - Harvesting energy, remote mining, market trades
- `combat` - Battle reports and attack logs
- `defense` - Defensive status for rooms, remotes and others
- `resource` - Minerals, boosts, powers and other resources
- `movement` - Creep pathfinding and movement logs
- `events` - Major AI decisions, missions, and ownership changes
- `spawn` - Creep spawning and lifecycle tracking
- `construct` - Building, repairing, and construction site updates

#### **Available Log Levels**
| Level   | Purpose                                      |
|---------|----------------------------------------------|
| `fatal` | 🚨 Critical errors that may crash the bot   |
| `error` | ❌ Non critical errors that may cause unexpected behavior |
| `warn`  | ⚠️ Potential issues that require attention  |
| `info`  | ℹ️ General operational messages            |
| `debug` | 🛠 Detailed debugging messages              |
| `trace` | 🔍 Highly detailed execution flow          |

#### **Options**
| Option        | Type     | Default    | Description                                       |
|--------------|---------|------------|--------------------------------------------------|
| `roomName`   | string  | `undefined` | The room where the event happened. Generates a hyperlink to the room or history. |
| `notify`     | boolean | `false`     | If `true`, sends an email notification.         |
| `terminalOnly` | boolean | `false`     | If `true`, logs only to the terminal.           |
| `tick`       | number  | `Game.time` | Tick number when the event occurred.            |

---

## Contributing

1. Fork the repository.
2. Create a new branch (`feature-xyz`).
3. Commit changes with descriptive messages.
4. Open a pull request.

---

## License

MIT License. Feel free to modify and distribute.

