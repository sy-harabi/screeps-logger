const Logger = require("./logger")
const assert = require("assert")

console.log("Running Logger Unit Tests...")

const testLogger = new Logger("TestModule", { level: Logger.LOG_LEVELS.DEBUG })

// Test logging levels
testLogger.info("Info message")
testLogger.warn("Warning message")
testLogger.error("Error message")

testLogger.debug("Debug message")
testLogger.trace("Trace message")

testLogger.fatal("Fatal message")

// Check if log is stored in memory
assert.ok(Memory._logs["TestModule"], "Log should be stored in Memory")
assert.ok(Memory._logs["TestModule"].index !== undefined, "Log index should exist")

// Ensure log streaming is working
Logger.stream("TestModule")
assert.ok(Logger.getStreamTarget().includes("TestModule"), "Stream should target TestModule")

// Test room link generation
const roomLink = testLogger.getRoomLink("W1N1")
assert.ok(roomLink.includes("W1N1"), "Room link should contain room name")

// Test replay link generation
const replayLink = testLogger.getReplayLink("W1N1")
assert.ok(replayLink.includes("history"), "Replay link should contain history path")

console.log("All tests passed!")
