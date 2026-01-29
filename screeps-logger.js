/**
 * @fileoverview Screeps logging module providing a comprehensive logging system with
 * multiple log levels, categories, and output rendering capabilities. Supports console
 * output with HTML styling, log storage via ring buffer, and game notifications.
 *
 * Features:
 * - 5 log levels (ERROR, WARN, INFO, DEBUG, TRACE)
 * - 17 log categories (SPAWN, MOVE, PATH, DEFENSE, etc.)
 * - Ring buffer storage for limited log history
 * - HTML-formatted console output with color coding
 * - Screeps game notifications for important events
 * - Room link generation with replay support
 * - Time formatting adjusted for regional timezone
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** UTC time offset in minutes. Adjust this to your region */
const TIME_OFFSET = 540

/** Maximum number of log entries to store in the ring buffer */
const MAX_LOG_NUM = 100

/** Interval in minutes between consecutive notifications for the same message */
const NOTIFY_INTERVAL = 60

/**
 * API endpoint paths for room and replay links
 * @type {Object<string, string>}
 */
const PATH = {
  shardSeason: "https://screeps.com/season",
  shard0: "https://screeps.com/a",
  shard1: "https://screeps.com/a",
  shard2: "https://screeps.com/a",
  shard3: "https://screeps.com/a",
  private: "http://private.localhost:8080/(http://localhost:21025)",
}

const isMMO = ["shardSeason", "shard0", "shard1", "shard2", "shard3"].includes(Game.shard.name)

// ============================================================================
// ENUMS / TYPES
// ============================================================================

/**
 * Log level enumeration
 * @enum {number}
 * @property {number} ERROR=0 Error level
 * @property {number} WARN=1 Warning level
 * @property {number} INFO=2 Information level
 * @property {number} DEBUG=3 Debug level
 * @property {number} TRACE=4 Trace level (most verbose)
 */
const LOG_LEVEL = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
}

/**
 * Log category enumeration for organizing logs by functionality
 * @enum {number}
 * @property {number} SPAWN=0 Spawn management
 * @property {number} MOVE=1 Movement operations
 * @property {number} PATH=2 Pathfinding
 * @property {number} ECON=3 Economic management
 * @property {number} CLAIM=4 Room claiming
 * @property {number} LAB=5 Laboratory operations
 * @property {number} DEFENSE=6 Defense operations
 * @property {number} OFFENSE=7 Offensive operations
 * @property {number} SIEGE=8 Siege operations
 * @property {number} QUAD=9 Quad squad operations
 * @property {number} INTEL=10 Intelligence gathering
 * @property {number} OBSERVER=11 Observer operations
 * @property {number} EXPAND=12 Expansion planning
 * @property {number} CPU=13 CPU management
 * @property {number} MEM=14 Memory management
 * @property {number} ERROR=15 Error reporting
 * @property {number} SYSTEM=16 System operations
 */
const LOG_CAT = {
  // --- Core (0–9) ---
  SPAWN: 0,
  MOVE: 1,
  PATH: 2,
  ECON: 3,
  CLAIM: 4,
  LAB: 5,
  ROOM: 6,
  HAUL: 7,

  // --- Combat (10–19) ---
  DEFENSE: 10,
  OFFENSE: 11,
  SIEGE: 12,
  QUAD: 13,

  // --- Planning / Intel (20–29) ---
  INTEL: 20,
  OBSERVER: 21,
  EXPAND: 22,
  MISSION: 23,

  // --- Infra (30–39) ---
  CPU: 30,
  MEM: 31,
  ERROR: 32,
  SYSTEM: 33,
}

const CAT_NAME = buildTextDict(LOG_CAT)

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Builds a lookup dictionary mapping enum values to human-readable names
 * @param {Object} enumObj - Enum object with key-value pairs
 * @returns {Object} Dictionary mapping numeric values to humanized names
 */
function buildTextDict(enumObj) {
  const out = {}
  for (const [key, val] of Object.entries(enumObj)) {
    out[val] = key
  }
  return out
}

/**
 * Formats a value for log output without JSON's excessive quotes
 * @param {*} value - Any value to format
 * @param {number} [depth=0] - Current recursion depth
 * @param {number} [maxDepth=3] - Maximum recursion depth
 * @returns {string} Formatted string representation
 */
function formatValue(value, depth = 0, maxDepth = 3) {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return "[...]"
  }
  // Handle null/undefined
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  // Handle primitives (string, number, boolean)
  const type = typeof value
  if (type === "string" || type === "number" || type === "boolean") {
    return String(value)
  }
  // Handle arrays
  if (Array.isArray(value)) {
    const items = value.map((v) => formatValue(v, depth + 1, maxDepth))
    return `[${items.join(", ")}]`
  }
  // Handle objects
  if (type === "object") {
    // Handle special Screeps objects with name or id
    if (value.name && typeof value.name === "string") return value.name
    if (value.id) return value.id
    const pairs = Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v, depth + 1, maxDepth)}`)
    return `{${pairs.join(", ")}}`
  }

  // Handle functions
  if (type === "function") {
    return "[function]"
  }

  return String(value)
}

// ============================================================================
// RENDERING CONFIGURATION
// ============================================================================

/**
 * Color map for log level visualization in console output
 * @type {Object<string, string>}
 */
const LEVEL_COLORS = {
  0: "#FF6B6B", // Light Red (ERROR / CRITICAL)
  1: "#FFD166", // Bright Amber (WARN)
  2: "#4DA3FF", // Bright Blue (INFO)
  3: "#6BCF8E", // Light Green (DEBUG)
  4: "#9E9E9E", // Light Gray (TRACE)
}

/**
 * Display names for log levels with padding
 * @type {string[]}
 */
const LEVEL_NAME = ["ERROR", "WARN ", "INFO ", "DEBUG", "TRACE"]

// ============================================================================
// RING BUFFER (LOG STORAGE)
// ============================================================================

/**
 * Ring buffer for storing recent log entries
 * Maintains a fixed-size circular buffer with FIFO semantics
 * @type {Object}
 * @property {number} head - Current write position in buffer
 * @property {number} size - Total buffer capacity
 * @property {Array} buf - Circular buffer array storing log entries
 */
global.__logRing = {
  head: 0,
  size: MAX_LOG_NUM,
  buf: new Array(MAX_LOG_NUM),
}

/**
 * Adds a log entry to the ring buffer
 * @param {Object} entry - Log entry object
 */
function pushRing(entry) {
  const r = global.__logRing
  r.buf[r.head] = entry
  r.head = (r.head + 1) % r.size
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/** Cached formatted time string */
let formattedTimeTick, formattedTime

/**
 * Formats a timestamp to a human-readable string with regional timezone adjustment
 * Caches result per game tick for performance
 * @param {number} timestamp - Millisecond timestamp (from Date.now())
 * @returns {string} Time formatted as YYYY.MM.DD. HH:MM
 */
function getFormattedTime(timestamp) {
  if (formattedTimeTick === Game.time) {
    return formattedTime
  }

  formattedTimeTick = Game.time

  function pad(number) {
    return String(number).padStart(2, "0")
  }

  const now = new Date(timestamp)
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const timezoneNow = utcNow + TIME_OFFSET * 60 * 1000
  const timezoneDate = new Date(timezoneNow)

  const month = pad(timezoneDate.getMonth() + 1)
  const date = pad(timezoneDate.getDate())

  const hours = pad(timezoneDate.getHours())
  const minutes = pad(timezoneDate.getMinutes())

  const result = `${timezoneDate.getFullYear()}.${month}.${date}. ${hours}:${minutes}`

  return (formattedTime = result)
}

// ============================================================================
// URL & LINK UTILITIES
// ============================================================================

/**
 * Escapes special characters in room names for use in URLs
 * Converts N/S/E/W directional characters to URL-encoded format
 * @param {string} roomName - The room name to escape
 * @returns {string} URL-safe room name
 */
function roomURLescape(roomName) {
  let mapping = { N: "%4E", S: "%53", E: "%45", W: "%57" }
  let out = ""
  for (let i = 0; i < roomName.length; i++) {
    let c = roomName[i]
    out += mapping[c] || c
  }
  return out
}

/**
 * Generates a URL to a Screeps room viewer
 * @param {string} roomName - The room to link to
 * @returns {string} Full URL to the room
 */
function getRoomUrl(roomName) {
  const front = PATH[Game.shard.name] || PATH["world"]

  return front + `/#!/room/${Game.shard.name}/${roomURLescape(roomName)}`
}

/**
 * Generates an HTML link to a Screeps room
 * @param {string} roomName - The room name to link
 * @returns {string} HTML anchor tag with room link
 */
function getRoomLink(roomName) {
  const url = getRoomUrl(roomName)
  return `<a href="${url}" target="_blank">${roomName}</a>`
}

/**
 * Generates an HTML link to a room's replay at a specific tick
 * @param {string} roomName - The room to replay
 * @param {number} [tick=Game.time] - The game tick to replay (defaults to current)
 * @param {string} [msg="replay"] - The link text
 * @returns {string} HTML anchor tag with replay link
 */
function getReplayLink(roomName, tick = Game.time) {
  const front = PATH[Game.shard.name] || PATH["world"]

  return (
    "<a href='" +
    front +
    "/#!/history/" +
    Game.shard.name +
    "/" +
    roomURLescape(roomName) +
    "?t=" +
    tick +
    "'>" +
    tick +
    "</a>"
  )
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Renders a log entry as a formatted string with HTML styling for console output
 * Applies color coding based on log level and special styling for context logs
 * @param {Object} entry - The log entry to render
 * @param {number} entry.t - Game tick when log was created
 * @param {number} entry.ts - Millisecond timestamp
 * @param {number} entry.l - Log level (0-4)
 * @param {number} entry.c - Log category
 * @param {string} entry.r - Room name (optional)
 * @param {number} entry.m - Message code
 * @param {Object} entry.d - Data dictionary (optional)
 * @param {Object} entry.f - Flags object (optional)
 * @returns {string} Formatted log line
 */
function render(entry) {
  const { t, ts, l, c, r, m, d, f } = entry

  const time = getFormattedTime(ts)

  let tick

  let roomName

  if (r) {
    roomName = getRoomLink(r)
    tick = getReplayLink(r, t)
  } else {
    roomName = "--"
    tick = t
  }

  let line = `[${time} ${tick}] [${LEVEL_NAME[l]}] [${CAT_NAME[c]}] [${roomName}] ${m}`

  if (d) {
    line += " ("
    line += Object.entries(d)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ")
    line += ")"
  }

  let coloredLine

  if (f && f.context) {
    coloredLine = `<span style="color:#888;font-style:italic">${line}</span>`
  } else {
    const color = LEVEL_COLORS[l]
    coloredLine = `<span style="color:${color}">${line}</span>`
  }

  // Console output
  if (isMMO) {
    console.logUnsafe(coloredLine)
  } else {
    console.log(coloredLine)
  }
  return coloredLine
}

// ============================================================================
// CORE LOGGING
// ============================================================================

/**
 * Logger configuration
 * @type {Object}
 * @property {number} level - Minimum log level to output (0-4)
 * @property {Set|null} enabledCats - Set of enabled categories, null means all
 */
const CFG = {
  level: LOG_LEVEL.INFO,
  enabledCats: null, // null = all
}

/**
 * Checks if a log entry should be emitted based on configuration
 * @param {number} level - The log level
 * @param {number} cat - The log category
 * @returns {boolean} True if the log should be emitted
 */
function enabled(level, cat) {
  if (level > CFG.level) return false
  if (CFG.enabledCats && !CFG.enabledCats.has(cat)) return false
  return true
}

/**
 * Determines if a log entry should trigger a game notification
 * By default only errors trigger notifications
 * @param {number} level - The log level
 * @param {number} msg - The message code
 * @returns {boolean} True if notification should be sent
 */
function shouldNotify(level, msg) {
  return level <= LOG_LEVEL.WARN
}

/**
 * Emits a log entry with rendering and notification handling
 * @param {number} level - Log level (0-4)
 * @param {number} cat - Log category
 * @param {string} roomName - Room name (optional)
 * @param {number} msg - Message code
 * @param {Object} data - Additional data dictionary (optional)
 * @param {Object} flags - Flags object with notification options (optional)
 * @param {boolean} [flags.notify] - Force notification even if below error/warn level
 * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
 * @private
 */
function emit(level, cat, roomName, msg, data, flags) {
  if (!enabled(level, cat)) return

  const entry = {
    t: Game.time,
    ts: Date.now(),
    l: level,
    c: cat,
    r: roomName,
    m: msg,
    d: data,
    f: flags,
  }

  const line = render(entry)

  pushRing(entry)

  if (shouldNotify(level, msg) || (flags && flags.notify)) {
    const interval = level === LOG_LEVEL.ERROR || (flags && flags.notifyNow) ? 0 : NOTIFY_INTERVAL
    Game.notify(line, interval)
  }
}

/**
 * Main Logger API
 * Provides methods for logging at different levels and managing configuration
 * @namespace Logger
 */
const Logger = {
  printLogs(predicate) {
    const logs = this.getLogs(predicate)

    logs.forEach((entry) => render(entry))
  },

  /**
   *
   * @param {function} [predicate] - function(entry) => boolean. Only entries for which the predicate returns tru will be returned.
   * @returns {Array} Get the log entries that are stored in heap
   */
  getLogs(predicate) {
    const result = []

    const r = global.__logRing

    for (let i = 0; i < r.size; i++) {
      const index = (r.head + i) % r.size
      const entry = r.buf[index]
      if (!entry || (predicate && !predicate(entry))) {
        continue
      }
      result.push(entry)
    }

    return result
  },

  /**
   * Sets the minimum log level for output
   * @param {string} name - Log level name ('ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE')
   */
  setLevel(name) {
    CFG.level = LOG_LEVEL[name]
  },

  /**
   * Enables logging for a specific category
   * Can be called multiple times to enable multiple categories
   * @param {number} cat - Category constant from LOG_CAT enum
   */
  enableCategory(cat) {
    if (!CFG.enabledCats) {
      CFG.enabledCats = new Set()
    }

    CFG.enabledCats.add(cat)
  },

  clearCategory() {
    CFG.enabledCats = null
  },

  /**
   * Logs an error
   * Errors are automatically notified via game notifications
   * @param {number} cat - Log category
   * @param {string} roomName - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  error(cat, roomName, msg, data, flags) {
    emit(LOG_LEVEL.ERROR, cat, roomName, msg, data, flags)
  },

  /**
   * Logs a warning
   * Warnings are automatically notified via game notifications
   * @param {number} cat - Log category
   * @param {string} roomName - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  warn(cat, roomName, msg, data, flags) {
    emit(LOG_LEVEL.WARN, cat, roomName, msg, data, flags)
  },

  /**
   * Logs info level message
   * Use flags.notify to send notification for interesting events
   * @param {number} cat - Log category
   * @param {string} roomName - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  info(cat, roomName, msg, data, flags) {
    emit(LOG_LEVEL.INFO, cat, roomName, msg, data, flags)
  },

  /**
   * Logs debug level message
   * Use flags.notify to send notification for important debug events
   * @param {number} cat - Log category
   * @param {string} roomName - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  debug(cat, roomName, msg, data, flags) {
    emit(LOG_LEVEL.DEBUG, cat, roomName, msg, data, flags)
  },

  /**
   * Logs trace level message (most verbose)
   * Use flags.notify to send notification for important trace events
   * @param {number} cat - Log category
   * @param {string} roomName - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  trace(cat, roomName, msg, data, flags) {
    emit(LOG_LEVEL.TRACE, cat, roomName, msg, data, flags)
  },

  /**
   * Logs a context message with special styling (warning level)
   * Provides visual hierarchy for related log groups
   * @param {number} cat - Log category
   * @param {string} roomName - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  context(cat, roomName, msg, data, flags = {}) {
    flags.context = true
    emit(LOG_LEVEL.WARN, cat, roomName, msg, data, flags)
  },
}

module.exports = {
  LOG_CAT,
  getRoomLink,
  getReplayLink,
  Logger,
}
