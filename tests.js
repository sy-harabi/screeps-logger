const Logger = require("./logger2")

console.log("Running Logger Unit Tests...")

const testLogger = new Logger("TestModule", { level: 4 }) // Using numeric value for DEBUG

// Test logging levels
testLogger.info("Info message")
testLogger.warn("Warning message")
testLogger.error("Error message")

testLogger.debug("Debug message")
testLogger.trace("Trace message")

testLogger.fatal("Fatal message")

// Test warn with roomName
testLogger.warn("Warning in room", { roomName: "W1N1" })

// Check if log is stored in memory
if (!Memory._logs || !Memory._logs["TestModule"]) {
  console.log("Log should be stored in Memory - FAILED")
} else {
  console.log("Log is stored in Memory - PASSED")
}

if (!Memory._logs["TestModule"] || Memory._logs["TestModule"].index === undefined) {
  console.log("Log index should exist - FAILED")
} else {
  console.log("Log index exists - PASSED")
}

// Ensure log streaming is working
Logger.stream("TestModule")
if (!Logger.getStreamTarget().includes("TestModule")) {
  console.log("Stream should target TestModule - FAILED")
} else {
  console.log("Stream is correctly set - PASSED")
}

// Test room link generation
const roomLink = Logger.getRoomLink("W1N1")
if (!roomLink.includes("W1N1")) {
  console.log("Room link should contain room name - FAILED")
} else {
  console.log("Room link contains room name - PASSED")
}

// Test replay link generation
const replayLink = Logger.getReplayLink("W1N1")
if (!replayLink.includes("history")) {
  console.log("Replay link should contain history path - FAILED")
} else {
  console.log("Replay link contains history path - PASSED")
}

console.log("All tests completed!")
