const Logger = require("./logger2")

// Custom format function example
function customFormat(name, entry) {
  return `(${entry.tick}) [${name}] ${entry.message}`
}

// Create logger instances
const myLogger = new Logger("myLogger", { level: 4, limit: 100 }) // Default format
const customLogger = new Logger("customLogger", { level: 3, format: customFormat }) // Custom format

// Log messages
myLogger.warn("Enemy creep appeared!", { roomName: "W1N1" })
customLogger.info("Custom formatted log entry")

// Create another logger
const myLogger2 = new Logger("myLogger2")

// Stream only myLogger's logs
Logger.stream(myLogger.name)
myLogger2.fatal("This will not be logged") // Will not appear
myLogger.info("This will be logged") // Will appear

// Stop streaming restriction
Logger.stream()
myLogger2.warn("Now this will appear")

// Print logs
myLogger.print()
customLogger.print()

// Clear logs
myLogger.clear()

// Other logs are alive
myLogger2.print()

// Clear all the logs
Logger.clearAll()

// This will not appear
customLogger.print()

// Global methods for logging utilities
global.streamLog = function (name) {
  Logger.stream(name)
}

global.printLog = function (name) {
  if (name === "myLogger") {
    myLogger.print()
  } else if (name === "customLogger") {
    customLogger.print()
  }
}

global.clearLog = function (name) {
  if (!name) {
    Logger.clearAll()
  } else if (name === "myLogger") {
    myLogger.clear()
  } else if (name === "customLogger") {
    customLogger.clear()
  }
}
