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
  world: "https://screeps.com/a",
}

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
  // --- Core ---
  SPAWN: 0,
  MOVE: 1,
  PATH: 2,
  ECON: 3,
  CLAIM: 4,
  LAB: 5,

  // --- Combat ---
  DEFENSE: 6,
  OFFENSE: 7,
  SIEGE: 8,
  QUAD: 9,

  // --- Planning / Intel ---
  INTEL: 10,
  OBSERVER: 11,
  EXPAND: 12,

  // --- Infra ---
  CPU: 13,
  MEM: 14,
  ERROR: 15,
  SYSTEM: 16,
}

const CAT_NAME = buildTextDict(LOG_CAT)

/**
 * Message codes for SPAWN category
 * @enum {number}
 */
const MSG_SPAWN = {
  SUCCESS: 100,
  FAILED: 101,
  QUEUED: 102,
  CANCELLED: 103,
  ENERGY_LOW: 104,
}

/**
 * Message codes for MOVE category
 * @enum {number}
 */
const MSG_MOVE = {
  STARTED: 200,
  BLOCKED: 201,
  STUCK: 202,
  FAILED: 203,
  COMPLETED: 204,
}

/**
 * Message codes for PATH category
 * @enum {number}
 */
const MSG_PATH = {
  FOUND: 300,
  NOT_FOUND: 301,
  BLOCKED: 302,
  RECALCULATING: 303,
  FAILED: 304,
}

/**
 * Message codes for ECON category
 * @enum {number}
 */
const MSG_ECON = {
  RESOURCES_LOW: 400,
  STORAGE_FULL: 401,
  STORAGE_EMPTY: 402,
  ENERGY_SHORTAGE: 403,
  ENERGY_SURPLUS: 404,
}

/**
 * Message codes for CLAIM category
 * @enum {number}
 */
const MSG_CLAIM = {
  STARTED: 500,
  SUCCESS: 501,
  FAILED: 502,
  ATTACKED: 503,
  RESERVED: 504,
}

/**
 * Message codes for LAB category
 * @enum {number}
 */
const MSG_LAB = {
  REACTION_START: 600,
  REACTION_COMPLETE: 601,
  REACTION_FAILED: 602,
  DELIVER_FAILED: 603,
  EMPTY: 604,
}

/**
 * Message codes for DEFENSE category
 * @enum {number}
 */
const MSG_DEFENSE = {
  ENEMY_DETECTED: 700,
  DEFEND_START: 701,
  DEFEND_LOST: 702,
  DEFEND_WON: 703,
  WALL_BREACHED: 704,
}

/**
 * Message codes for OFFENSE category
 * @enum {number}
 */
const MSG_OFFENSE = {
  ATTACK_STARTED: 800,
  ATTACK_SUCCESS: 801,
  ATTACK_FAILED: 802,
  TARGET_DESTROYED: 803,
  RETREAT: 804,
}

/**
 * Message codes for SIEGE category
 * @enum {number}
 */
const MSG_SIEGE = {
  STARTED: 900,
  PROGRESS: 901,
  COMPLETED: 902,
  FAILED: 903,
  RETREATED: 904,
}

/**
 * Message codes for QUAD category
 * @enum {number}
 */
const MSG_QUAD = {
  FORMED: 1000,
  ATTACK: 1001,
  DISBANDED: 1002,
  DAMAGED: 1003,
  DESTROYED: 1004,
}

/**
 * Message codes for INTEL category
 * @enum {number}
 */
const MSG_INTEL = {
  UPDATED: 1100,
  THREAT_DETECTED: 1101,
  OPPORTUNITY: 1102,
  CONFIRMED: 1103,
  EXPIRED: 1104,
}

/**
 * Message codes for OBSERVER category
 * @enum {number}
 */
const MSG_OBSERVER = {
  COMPLETE: 1200,
  FAILED: 1201,
  SCHEDULED: 1202,
  CANCELLED: 1203,
  DATA: 1204,
}

/**
 * Message codes for EXPAND category
 * @enum {number}
 */
const MSG_EXPAND = {
  STARTED: 1300,
  AVAILABLE: 1301,
  FAILED: 1302,
  COMPLETED: 1303,
  CANCELLED: 1304,
}

/**
 * Message codes for CPU category
 * @enum {number}
 */
const MSG_CPU = {
  CRITICAL: 1400,
  HIGH: 1401,
  NORMAL: 1402,
  EXCEEDED: 1403,
  BUCKET_LOW: 1404,
}

/**
 * Message codes for MEM category
 * @enum {number}
 */
const MSG_MEM = {
  CRITICAL: 1500,
  HIGH: 1501,
  NORMAL: 1502,
  CORRUPTED: 1503,
  RESET: 1504,
}

/**
 * Message codes for ERROR category
 * @enum {number}
 */
const MSG_ERROR = {
  CRITICAL: 1600,
  UNEXPECTED: 1601,
  VALIDATION: 1602,
  RECOVERY_FAILED: 1603,
  ROLLBACK: 1604,
}

/**
 * Message codes for SYSTEM category
 * @enum {number}
 */
const MSG_SYSTEM = {
  RESET: 1700,
  STARTUP: 1701,
  SHUTDOWN: 1702,
  CHECK: 1703,
  RECOVER: 1704,
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Converts enum key to human-readable text
 * Transforms snake_case to Title Case (e.g., 'SPAWN_ROOM' becomes 'Spawn Room')
 * @param {string} key - The enum key to humanize
 * @returns {string} The humanized text
 */
function humanize(key) {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Builds a lookup dictionary mapping enum values to human-readable names
 * @param {Object} enumObj - Enum object with key-value pairs
 * @returns {Object} Dictionary mapping numeric values to humanized names
 */
function buildTextDict(enumObj) {
  const out = {}
  for (const [key, val] of Object.entries(enumObj)) {
    out[val] = humanize(key)
  }
  return out
}

/**
 * Message text lookup dictionary
 * Maps message codes to human-readable descriptions
 * @type {Object<number, string>}
 */
const MSG_TEXT = {
  ...buildTextDict(MSG_SPAWN),
  ...buildTextDict(MSG_MOVE),
  ...buildTextDict(MSG_PATH),
  ...buildTextDict(MSG_ECON),
  ...buildTextDict(MSG_CLAIM),
  ...buildTextDict(MSG_LAB),
  ...buildTextDict(MSG_DEFENSE),
  ...buildTextDict(MSG_OFFENSE),
  ...buildTextDict(MSG_SIEGE),
  ...buildTextDict(MSG_QUAD),
  ...buildTextDict(MSG_INTEL),
  ...buildTextDict(MSG_OBSERVER),
  ...buildTextDict(MSG_EXPAND),
  ...buildTextDict(MSG_CPU),
  ...buildTextDict(MSG_MEM),
  ...buildTextDict(MSG_ERROR),
  ...buildTextDict(MSG_SYSTEM),
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

  const msg = MSG_TEXT[m] || `MSG_${m}`
  let line = `[${time} ${tick}] [${LEVEL_NAME[l]}] [${CAT_NAME[c]}] [${roomName}] ${msg}`

  if (d) {
    line += " ("
    line += Object.entries(d)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")
    line += ")"
  }

  // visual hierarchy (console only)
  if (f && f.context) {
    console.logUnsafe(`<span style="color:#888;font-style:italic">${line}</span>`)
  } else {
    const color = LEVEL_COLORS[l]
    console.log(color)
    console.logUnsafe(`<span style="color:${color}">${line}</span>`)
  }

  return line
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
   * @param {string} room - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  error(cat, room, msg, data, flags) {
    emit(LOG_LEVEL.ERROR, cat, room, msg, data, flags)
  },

  /**
   * Logs a warning
   * Warnings are automatically notified via game notifications
   * @param {number} cat - Log category
   * @param {string} room - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  warn(cat, room, msg, data, flags) {
    emit(LOG_LEVEL.WARN, cat, room, msg, data, flags)
  },

  /**
   * Logs info level message
   * Use flags.notify to send notification for interesting events
   * @param {number} cat - Log category
   * @param {string} room - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  info(cat, room, msg, data, flags) {
    emit(LOG_LEVEL.INFO, cat, room, msg, data, flags)
  },

  /**
   * Logs debug level message
   * Use flags.notify to send notification for important debug events
   * @param {number} cat - Log category
   * @param {string} room - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  debug(cat, room, msg, data, flags) {
    emit(LOG_LEVEL.DEBUG, cat, room, msg, data, flags)
  },

  /**
   * Logs trace level message (most verbose)
   * Use flags.notify to send notification for important trace events
   * @param {number} cat - Log category
   * @param {string} room - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  trace(cat, room, msg, data, flags) {
    emit(LOG_LEVEL.TRACE, cat, room, msg, data, flags)
  },

  /**
   * Logs a context message with special styling (warning level)
   * Provides visual hierarchy for related log groups
   * @param {number} cat - Log category
   * @param {string} room - Room name
   * @param {number} msg - Message code
   * @param {Object} [data] - Additional data
   * @param {Object} [flags] - Options for notification control
   * @param {boolean} [flags.notify] - Force notification for this log
   * @param {boolean} [flags.notifyNow] - Send immediately (bypass throttling)
   */
  context(cat, room, msg, data, flags = {}) {
    flags.context = true
    emit(LOG_LEVEL.WARN, cat, room, msg, data, flags)
  },
}

module.exports = {
  LOG_LEVEL,
  LOG_CAT,
  MSG_SPAWN,
  MSG_MOVE,
  MSG_PATH,
  MSG_ECON,
  MSG_CLAIM,
  MSG_LAB,
  MSG_DEFENSE,
  MSG_OFFENSE,
  MSG_SIEGE,
  MSG_QUAD,
  MSG_INTEL,
  MSG_OBSERVER,
  MSG_EXPAND,
  MSG_CPU,
  MSG_MEM,
  MSG_ERROR,
  MSG_SYSTEM,
  MSG_TEXT,
  getRoomLink,
  getReplayLink,
  Logger,
}
