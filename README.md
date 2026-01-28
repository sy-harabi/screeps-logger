# Screeps Logger

A comprehensive logging system for Screeps with multiple log levels, categories, and advanced filtering capabilities.

## Features

- **5 Log Levels**: ERROR, WARN, INFO, DEBUG, TRACE
- **17 Log Categories**: Organized by functionality (SPAWN, MOVE, DEFENSE, COMBAT, etc.)
- **Ring Buffer Storage**: Efficient circular buffer for limited log history (max 100 entries)
- **HTML Styled Console Output**: Color-coded logs for easy visual scanning
- **Game Notifications**: Automatic notifications for errors/warnings, selective notification for interesting events
- **Room Links**: Auto-generated clickable links to rooms and replays
- **Regional Timezone Support**: Configurable time offset for local time display
- **Smart Throttling**: Prevents notification spam with configurable intervals

## Installation

```javascript
import {
  Logger,
  LOG_LEVEL,
  LOG_CAT,
  MSG_SPAWN,
  MSG_DEFENSE,
  MSG_OFFENSE,
  MSG_CPU,
  MSG_PATH,
  getReplayLink,
  getRoomLink,
} from "./screeps-logger2.js"
```

## Quick Start

### Basic Usage

```javascript
import { Logger, LOG_CAT, MSG_SPAWN, MSG_DEFENSE, MSG_OFFENSE, MSG_CPU, MSG_PATH } from "./screeps-logger2.js"

// Log an error
Logger.error(LOG_CAT.SPAWN, "E1S1", MSG_SPAWN.FAILED, { spawned: 5 })

// Log a warning
Logger.warn(LOG_CAT.DEFENSE, "E5S5", MSG_DEFENSE.ENEMY_DETECTED, { enemies: 2 })

// Log info
Logger.info(LOG_CAT.OFFENSE, "E2S2", MSG_OFFENSE.ATTACK_SUCCESS, { killed: 1 })

// Log debug
Logger.debug(LOG_CAT.CPU, null, MSG_CPU.NORMAL, { cpuUsed: 45.2 })

// Log trace (most verbose)
Logger.trace(LOG_CAT.PATH, "E3S3", MSG_PATH.FOUND, { path: "A>B>C" })
```

### With Notifications

```javascript
// Auto-notified errors/warnings
Logger.error(LOG_CAT.DEFENSE, "E5S5", MSG_DEFENSE.WALL_BREACHED)

// Manually request notification for info events
Logger.info(LOG_CAT.OFFENSE, "E2S2", MSG_OFFENSE.TARGET_DESTROYED, { killed: 5 }, { notify: true })

// Send immediately without throttling
Logger.warn(LOG_CAT.DEFENSE, "E5S5", MSG_DEFENSE.DEFEND_LOST, { critical: true }, { notifyNow: true })
```

### Configuration

```javascript
// Set minimum log level (shows ERROR and WARN only)
Logger.setLevel("WARN")

// Enable specific categories only
Logger.enableCategory(LOG_CAT.DEFENSE)
Logger.enableCategory(LOG_CAT.OFFENSE)

// Clear category filter (show all)
Logger.clearCategory()
```

## API Reference

### Logging Methods

All logging methods accept the same parameters:

```javascript
Logger.error(cat, room, msg, data, flags)
Logger.warn(cat, room, msg, data, flags)
Logger.info(cat, room, msg, data, flags)
Logger.debug(cat, room, msg, data, flags)
Logger.trace(cat, room, msg, data, flags)
Logger.context(cat, room, msg, data, flags)
```

**Parameters:**

- `cat` (number): Log category from `LOG_CAT` enum
- `room` (string, optional): Room name
- `msg` (number): Message code
- `data` (Object, optional): Additional data as key-value pairs
- `flags` (Object, optional):
  - `notify`: Force notification even if below error/warn level
  - `notifyNow`: Send immediately (bypass NOTIFY_INTERVAL throttling)

### Configuration Methods

#### `Logger.setLevel(name)`

Sets the minimum log level for output.

```javascript
Logger.setLevel("INFO") // Show INFO, DEBUG, TRACE (not WARN/ERROR)
Logger.setLevel("ERROR") // Show only ERROR
Logger.setLevel("TRACE") // Show everything
```

**Valid levels:**

- `'ERROR'` - 0 (highest priority)
- `'WARN'` - 1
- `'INFO'` - 2
- `'DEBUG'` - 3
- `'TRACE'` - 4 (most verbose)

#### `Logger.enableCategory(cat)`

Restricts logging to specific categories. Once enabled, only logs in those categories are shown.

```javascript
Logger.enableCategory(LOG_CAT.DEFENSE)
Logger.enableCategory(LOG_CAT.OFFENSE)
// Now only DEFENSE and OFFENSE logs are shown
```

#### `Logger.clearCategory()`

Removes category filter, showing all categories again.

```javascript
Logger.clearCategory()
```

### Helper Functions

#### `getRoomLink(roomName)`

Generates an HTML link to a Screeps room viewer.

```javascript
const link = getRoomLink("E1S1")
// Returns: <a href="..." target="_blank">E1S1</a>
```

#### `getReplayLink(roomName, tick, msg)`

Generates an HTML link to a room's replay at a specific tick.

```javascript
const link = getReplayLink("E1S1", 12345, "view replay")
// Returns: <a href="..." target="_blank">view replay</a>
```

## Log Categories & Message Codes

Available categories in `LOG_CAT` enum with corresponding message codes:

### Core Operations

#### SPAWN (0)

| Code | Message    |
| ---- | ---------- |
| 100  | SUCCESS    |
| 101  | FAILED     |
| 102  | QUEUED     |
| 103  | CANCELLED  |
| 104  | ENERGY_LOW |

#### MOVE (1)

| Code | Message   |
| ---- | --------- |
| 200  | STARTED   |
| 201  | BLOCKED   |
| 202  | STUCK     |
| 203  | FAILED    |
| 204  | COMPLETED |

#### PATH (2)

| Code | Message       |
| ---- | ------------- |
| 300  | FOUND         |
| 301  | NOT_FOUND     |
| 302  | BLOCKED       |
| 303  | RECALCULATING |
| 304  | FAILED        |

#### ECON (3)

| Code | Message         |
| ---- | --------------- |
| 400  | RESOURCES_LOW   |
| 401  | STORAGE_FULL    |
| 402  | STORAGE_EMPTY   |
| 403  | ENERGY_SHORTAGE |
| 404  | ENERGY_SURPLUS  |

#### CLAIM (4)

| Code | Message  |
| ---- | -------- |
| 500  | STARTED  |
| 501  | SUCCESS  |
| 502  | FAILED   |
| 503  | ATTACKED |
| 504  | RESERVED |

#### LAB (5)

| Code | Message           |
| ---- | ----------------- |
| 600  | REACTION_START    |
| 601  | REACTION_COMPLETE |
| 602  | REACTION_FAILED   |
| 603  | DELIVER_FAILED    |
| 604  | EMPTY             |

### Combat

#### DEFENSE (6)

| Code | Message        |
| ---- | -------------- |
| 700  | ENEMY_DETECTED |
| 701  | DEFEND_START   |
| 702  | DEFEND_LOST    |
| 703  | DEFEND_WON     |
| 704  | WALL_BREACHED  |

#### OFFENSE (7)

| Code | Message          |
| ---- | ---------------- |
| 800  | ATTACK_STARTED   |
| 801  | ATTACK_SUCCESS   |
| 802  | ATTACK_FAILED    |
| 803  | TARGET_DESTROYED |
| 804  | RETREAT          |

#### SIEGE (8)

| Code | Message   |
| ---- | --------- |
| 900  | STARTED   |
| 901  | PROGRESS  |
| 902  | COMPLETED |
| 903  | FAILED    |
| 904  | RETREATED |

#### QUAD (9)

| Code | Message   |
| ---- | --------- |
| 1000 | FORMED    |
| 1001 | ATTACK    |
| 1002 | DISBANDED |
| 1003 | DAMAGED   |
| 1004 | DESTROYED |

### Planning & Intelligence

#### INTEL (10)

| Code | Message         |
| ---- | --------------- |
| 1100 | UPDATED         |
| 1101 | THREAT_DETECTED |
| 1102 | OPPORTUNITY     |
| 1103 | CONFIRMED       |
| 1104 | EXPIRED         |

#### OBSERVER (11)

| Code | Message   |
| ---- | --------- |
| 1200 | COMPLETE  |
| 1201 | FAILED    |
| 1202 | SCHEDULED |
| 1203 | CANCELLED |
| 1204 | DATA      |

#### EXPAND (12)

| Code | Message   |
| ---- | --------- |
| 1300 | STARTED   |
| 1301 | AVAILABLE |
| 1302 | FAILED    |
| 1303 | COMPLETED |
| 1304 | CANCELLED |

### Infrastructure

#### CPU (13)

| Code | Message    |
| ---- | ---------- |
| 1400 | CRITICAL   |
| 1401 | HIGH       |
| 1402 | NORMAL     |
| 1403 | EXCEEDED   |
| 1404 | BUCKET_LOW |

#### MEM (14)

| Code | Message   |
| ---- | --------- |
| 1500 | CRITICAL  |
| 1501 | HIGH      |
| 1502 | NORMAL    |
| 1503 | CORRUPTED |
| 1504 | RESET     |

#### ERROR (15)

| Code | Message         |
| ---- | --------------- |
| 1600 | CRITICAL        |
| 1601 | UNEXPECTED      |
| 1602 | VALIDATION      |
| 1603 | RECOVERY_FAILED |
| 1604 | ROLLBACK        |

#### SYSTEM (16)

| Code | Message  |
| ---- | -------- |
| 1700 | RESET    |
| 1701 | STARTUP  |
| 1702 | SHUTDOWN |
| 1703 | CHECK    |
| 1704 | RECOVER  |

## Output Format

Logs are displayed in the Screeps console with the following format:

```
2026.01.28. 10:45 12345 ERROR 10 <a href="...">E1S1</a> Deliver Failed att=2 hp=50
```

**Format breakdown:**

- `2026.01.28. 10:45` - Timestamp (adjusted by TIME_OFFSET)
- `12345` - Game tick (or replay link if room provided)
- `ERROR` - Log level
- `10` - Category ID
- `<a href="...">E1S1</a>` - Room link (or "--" if no room)
- `Deliver Failed` - Message text
- `att=2 hp=50` - Additional data as key=value pairs

## Notification Behavior

### Automatic Notifications

Errors and warnings trigger automatic game notifications (throttled by NOTIFY_INTERVAL).

```javascript
import { Logger, LOG_CAT, MSG_DEFENSE, MSG_CPU } from "./screeps-logger2.js"

Logger.error(LOG_CAT.DEFENSE, "E5S5", MSG_DEFENSE.WALL_BREACHED) // Automatically notified
Logger.warn(LOG_CAT.CPU, null, MSG_CPU.CRITICAL) // Automatically notified
```

### Manual Notifications

Info, debug, and trace logs can optionally trigger notifications.

```javascript
// Notify if something interesting happens
Logger.info(LOG_CAT.OFFENSE, "E2S2", MSG_OFFENSE.TARGET_DESTROYED, { kills: 5 }, { notify: true })
```

### Immediate Notifications

Override throttling for critical alerts.

```javascript
import { Logger, LOG_CAT, MSG_DEFENSE } from "./screeps-logger2.js"

Logger.error(LOG_CAT.DEFENSE, "E5S5", MSG_DEFENSE.WALL_BREACHED, { critical: true }, { notifyNow: true })
// Sends immediately, no throttling
```

## Configuration Constants

Edit these constants at the top of the file to customize behavior:

```javascript
const TIME_OFFSET = 540 // UTC offset in minutes (540 = UTC+9)
const MAX_LOG_NUM = 100 // Ring buffer size
const NOTIFY_INTERVAL = 60 // Notification throttle interval in ticks
```

## Examples

### Monitor Defense

```javascript
import { Logger, LOG_CAT, MSG_DEFENSE } from "./screeps-logger2.js"

Logger.setLevel("WARN")
Logger.enableCategory(LOG_CAT.DEFENSE)

// In your defense logic:
if (enemies.length > 0) {
  Logger.warn(LOG_CAT.DEFENSE, room.name, MSG_DEFENSE.ENEMY_DETECTED, {
    enemies: enemies.length,
    positions: enemies.map((e) => e.pos).toString(),
  })
}

if (tower.hits < 50000) {
  Logger.error(
    LOG_CAT.DEFENSE,
    room.name,
    MSG_DEFENSE.WALL_BREACHED,
    {
      towerHp: tower.hits,
    },
    { notify: true },
  )
}
```

### Log Combat Victories

```javascript
import { Logger, LOG_CAT, MSG_OFFENSE } from "./screeps-logger2.js"

// Log interesting combat outcomes
if (enemy.hits < 0) {
  Logger.info(
    LOG_CAT.OFFENSE,
    room.name,
    MSG_OFFENSE.TARGET_DESTROYED,
    { killed: enemy.name, overkill: Math.abs(enemy.hits) },
    { notify: true }, // Notify about victories
  )
}
```

### CPU Monitoring

```javascript
import { Logger, LOG_CAT, MSG_CPU } from "./screeps-logger2.js"

const used = Game.cpu.getUsed()
const limit = Game.cpu.limit
const bucket = Game.cpu.bucket

if (used > limit * 0.9) {
  Logger.warn(LOG_CAT.CPU, null, MSG_CPU.CRITICAL, {
    used: used.toFixed(2),
    limit,
    bucket,
  })
} else {
  Logger.info(LOG_CAT.CPU, null, MSG_CPU.NORMAL, {
    used: used.toFixed(2),
    limit,
    bucket,
  })
}
```

### Spawn Cycle

```javascript
import { Logger, LOG_CAT, MSG_SPAWN } from "./screeps-logger2.js"

Logger.context(LOG_CAT.SPAWN, "E1S1", MSG_SPAWN.QUEUED, { action: "spawn_cycle_start" })

for (const spawn of spawns) {
  if (spawn.isActive()) {
    Logger.info(LOG_CAT.SPAWN, "E1S1", MSG_SPAWN.SUCCESS, { creepName: spawn.spawning.name })
  }
}

Logger.context(LOG_CAT.SPAWN, "E1S1", MSG_SPAWN.QUEUED, { action: "spawn_cycle_end" })

// Context logs can also have notifications
Logger.context(LOG_CAT.DEFENSE, "E5S5", MSG_DEFENSE.DEFEND_WON, { kills: 5 }, { notify: true })
```

### Lab Reactions

````javascript
import { Logger, LOG_CAT, MSG_LAB } from './screeps-logger2.js'

if (lab.runReaction(lab1, lab2)) {
  Logger.info(LOG_CAT.LAB, room.name, MSG_LAB.REACTION_START, {
    input1: lab1.mineralType,
    input2: lab2.mineralType
  })
} else {
  Logger.warn(LOG_CAT.LAB, room.name, MSG_LAB.REACTION_FAILED, {
    input1: lab1.mineralType,
    input2: lab2.mineralType
  })
}

## Storage

The module maintains a ring buffer (`global.__logRing`) storing up to 100 recent log entries. This can be accessed for analysis or debugging:

```javascript
const logs = global.__logRing.buf
const head = global.__logRing.head  // Current write position
````

Each entry contains:

- `t` - Game tick
- `ts` - Millisecond timestamp
- `l` - Log level (0-4)
- `c` - Category
- `r` - Room name
- `m` - Message code
- `d` - Data object
- `f` - Flags object

## Performance Notes

- Logging is very cheap; use DEBUG and TRACE liberally
- Console rendering with HTML styling is slightly more expensive
- Notifications trigger Screeps API calls; use throttling for repeated events
- Time formatting is cached per tick for efficiency

## License

See LICENSE file in repository
