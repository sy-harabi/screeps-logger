# Screeps Logger

A comprehensive logging system for Screeps designed to provide structured console output, category-based filtering, and historical log persistence.

## Features

- **Five Log Levels:** Supports `ERROR`, `WARN`, `INFO`, `DEBUG`, and `TRACE`.
- **Extensive Categorization:** Includes 17 predefined categories such as `SPAWN`, `DEFENSE`, `CPU`, and `ECON` to organize logs by functionality.
- **Console Rendering:** Outputs HTML-formatted strings with color coding for improved readability in the Screeps console.
- **Automatic Linking:** Generates clickable room links and replay links (mapped to the specific tick of the event) within the console output.
- **Ring Buffer Storage:** Maintains a circular buffer of the most recent 100 log entries in global memory (`global.__logRing`).
- **Notification System:** Integrates with `Game.notify` for `ERROR` and `WARN` levels, featuring a configurable notification interval to prevent spam.

## Installation

1. Include the `screeps-logger.js` file in your Screeps script directory.
2. Require the necessary components in your main loop or modules:

```javascript
const { Logger, LOG_CAT } = require("screeps-logger")
```

## Usage

The Logger API expects a structured set of parameters for every entry: `(category, roomName, message, data, flags)`.

### Basic Logging

```javascript
// Log a standard info message
Logger.info(LOG_CAT.SPAWN, "W1N1", "Spawned new Harvester", { energySpent: 300 })

// Log a warning with immediate notification
Logger.warn(LOG_CAT.DEFENSE, "W1N1", "Hostile creep detected", { owner: "Invader" }, { notifyNow: true })
```

### Log Level Methods

- `Logger.error(...)`: High priority; triggers immediate email notifications.
- `Logger.warn(...)`: Medium priority; triggers email notifications.
- `Logger.info(...)`: Standard operational logs.
- `Logger.debug(...)`: Detailed information for development.
- `Logger.trace(...)`: Highly verbose output for deep execution tracking.
- `Logger.context(...)`: Specialized styling for creating visual hierarchies in the console.

## Configuration

The module behavior can be adjusted through API calls or by modifying constants within the file.

### Dynamic Filtering

You can restrict the volume of logs during runtime:

- **Set Level:** `Logger.setLevel('DEBUG')` changes the minimum severity required to print to the console.
- **Enable Categories:** `Logger.enableCategory(LOG_CAT.CPU)` limits output to specific functional areas.
- **Clear Filters:** `Logger.clearCategory()` resets the category filter to show all logs.

### File Constants

The following values can be edited at the top of the source file:

- `TIME_OFFSET`: Set to your local timezone offset in minutes (default is 540).
- `MAX_LOG_NUM`: Adjust the size of the historical ring buffer (default is 100).
- `NOTIFY_INTERVAL`: Minutes to wait between repeat notifications for the same message (default is 60).

## History and Utilities

### Accessing Logs

Stored logs can be retrieved or reprinted using predicates:

```javascript
// Print all stored error logs to the console
Logger.printLogs((entry) => entry.l === LOG_LEVEL.ERROR)

// Retrieve raw log objects from the ring buffer
const logs = Logger.getLogs((entry) => entry.r === "W1N1")
```

### Direct Links

You may also use the exported link utilities independently:

```javascript
const { getRoomLink } = require("screeps-logger")
console.log("Investigate: " + getRoomLink("W1N2"))
```
