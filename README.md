# Screeps Logger

A structured and customizable logging system for Screeps. This module provides multiple logging levels, formatted outputs, memory persistence, and in-game notifications.

## Features

- **Logging Levels**: Supports `FATAL`, `ERROR`, `WARN`, `INFO`, `DEBUG`, and `TRACE`
- **Memory Storage**: Logs are stored in `Memory._logs`
- **Log Streaming**: Filter logs for specific modules
- **Replay & Room Links**: Generates clickable links for easier debugging
- **Notification System**: Sends alerts for critical issues
- **Colored Log Output**: Each level has a unique color for readability
- **Custom Formatting**: Define your own log format function

## Installation

To use this logger in your Screeps bot, add the `logger.js` file to your project and import it:

```javascript
const Logger = require("logger")
```

## Usage

### Creating a Logger Instance

```javascript
const myLogger = new Logger("MyModule", { level: 4, limit: 100 }) // level 4 is debug
```

### Logging Messages

```javascript
myLogger.info("Bot has started")
myLogger.warn("Resource shortage detected")
myLogger.error("Creep failed to spawn")
```

### Logging Messages With Lambda Function

```javascript
myLogger.setLevel(3) // level 3 is info
myLogger.info(() => someHeavyFunction()) // someHeavyFunction() will be called
myLogger.debug(() => someHeavyFunction()) // someHeavyFunction() will not be called
```

### Logging with Room Links

```javascript
myLogger.info("Spawn created", { roomName: "W1N1" })
```

### Using a Custom Format Function

You can define a custom log format function:

```javascript
function customFormat(name, entry) {
  return `(${entry.tick}) [${name}] ${entry.message}`
}

const customLogger = new Logger("CustomLogger", { format: customFormat })
customLogger.info("Custom formatted log entry")
```

### Streaming Logs

```javascript
Logger.stream("MyModule") // Only logs from "MyModule" will be displayed
Logger.stream(["MyModule", "CustomLogger"]) // Only logs from "MyModule" or "CustomLogger" will be displayed
```

### Stopping Log Streaming

```javascript
Logger.stream() // Stops the log filtering, all logs will be displayed
```

### Printing Logs

```javascript
myLogger.print()
```

### Setting Log Level

```javascript
myLogger.setLevel(2) // level 2 is warn.
```

### Clearing Logs

To clear all logs stored in memory, run:

```javascript
Logger.clearAll()
```

Or to clear logs for a specific module:

```javascript
myLogger.clear()
```

## Configuration

Modify these constants in `logger.js` as needed:

- `TIME_OFFSET`: Adjust timezone offset for logs
- `MAX_LOG_NUM`: Set the max number of logs per module
- `NOTIFY_INTERVAL`: Define the interval for sending notifications

## Contribution

Feel free to contribute by submitting pull requests or reporting issues.

## License

MIT License
