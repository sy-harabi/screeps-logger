/**
 * Logger module for Screeps
 * Provides structured logging with different severity levels, formatting, and memory persistence.
 */

const TIME_OFFSET = 540 // UTC time offset. Adjust this to your region

const MAX_LOG_NUM = 100

const NOTIFY_INTERVAL = 60

const PATH = {
  jaysee: "http://jayseegames.localhost:8080/(http://jayseegames.com:21025)",
  shardSeason: "https://screeps.com/season",
  DEFAULT: "https://screeps.com/a",
  thunderdrone: "http://localhost:8080/(https://server.pandascreeps.com/)",
}

const LEVEL_NAMES = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"]

const LOG_LEVELS = {
  FATAL: 0, // errors that can stop the entire bot
  ERROR: 1, // errors that might allow the bot to continue running
  WARN: 2, // potentially harmful situations
  INFO: 3, // highlight the progress of the bot or important events
  DEBUG: 4, // events that are useful to debug
  TRACE: 5, // minuscular events
}

const DEFAULT_LOG_LEVEL = LOG_LEVELS.INFO

const NOTIFY_LOG_LEVEL = LOG_LEVELS.WARN // notify via emial if log level is WARN or higher severity

const LEVEL_COLORS = {
  FATAL: "#C0392B", // Darker Red
  ERROR: "#B22222", // Firebrick
  WARN: "#B8860B", // Dark Goldenrod
  INFO: "#0055AA", // Deep Blue
  DEBUG: "#228B22", // Forest Green
  TRACE: "#555555", // Gray
  DEFAULT: "#dddddd", // Light Gray
}

/**
 * @typedef Entry - log entry
 * @property {number} level - Log severity level.
 * @property {string|function} message - Log message or function returning a message.
 * @property {number} timestamp - Timestamp.
 * @property {number} tick - Game tick.
 * @property {string} [roomName] - Room name for the log.
 * @property {boolean} [memory] - Whether to store log in memory.
 * @property {boolean} [notify] - Whether to send a notification.
 */

class Logger {
  /**
   * Enables or disables log streaming to specific modules.
   * @param {string|string[]} [names] - Names of modules to stream logs from.
   */
  static setStream(names) {
    if (!Memory._logs) {
      Memory._logs = {}
    }

    if (names === undefined) {
      delete Memory._logs._stream
      return
    }

    if (typeof names === "string") {
      names = [names]
    }

    Memory._logs._stream = names
  }

  /**
   * Retrieves the current log stream target.
   * @returns {string[]} - Array of module names being streamed.
   */
  static getStreamTarget() {
    if (!Memory._logs) {
      Memory._logs = {}
    }
    return Memory._logs._stream
  }

  /**
   * Clears all logs stored in memory.
   */
  static clearAll() {
    if (!Memory._logs) {
      return
    }

    for (const key in Memory._logs) {
      if (key !== "._stream") {
        delete Memory._logs[key]
      }
    }
  }

  /**
   * Generates a formatted time string.
   * @returns {string} - Formatted time string as YYYY.MM.DD. HH:MM.
   */
  static getReplayLink(roomName, tick = Game.time, msg = "replay") {
    const front = PATH[Game.shard.name] || PATH["DEFAULT"]

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
      msg +
      "</a>"
    )
  }

  /**
   * Generates link to the room.
   * @param {string} roomName
   * @returns {string}
   */
  static getRoomLink(roomName) {
    const url = getRoomUrl(roomName)
    return `<a href="${url}" target="_blank">${roomName}</a>`
  }

  /**
   * Formats a log entry.
   * @param {string} name - Logger name.
   * @param {Entry} entry - Log entry object.
   * @returns {string} - Formatted log entry with colors.
   */
  static defaultFormat(name, entry) {
    const { level, message, timestamp, tick = Game.time, roomName } = entry

    const formattedTime = getFormattedTime(timestamp)

    const levelName = LEVEL_NAMES[level]

    const levelNameFormatted = levelName.padEnd(5, " ")

    const nameFormatted = name.padEnd(10, " ")

    let result = `[${formattedTime}] [${tick}] [${levelNameFormatted}] [${nameFormatted}] [${message}]`

    if (roomName) {
      const roomLink = Logger.getRoomLink(roomName)
      result += ` [${roomLink}]`

      const replayLink = Logger.getReplayLink(roomName, tick)
      result += ` [${replayLink}]`
    }

    const color = LEVEL_COLORS[levelName] || LEVEL_COLORS["DEFAULT"]

    return getColoredText(result, color)
  }

  static defaultMemoryCallback(entry) {
    return entry.level <= LOG_LEVELS.INFO
  }

  static defaultNotifyCallback(entry) {
    return entry.level <= LOG_LEVELS.WARN
  }

  /**
   * Creates a new Logger instance.
   * @param {string} name - Logger name.
   * @param {object} [options] - Logger options.
   * @param {number} [options.level] - Minimum log level.
   * @param {number} [options.limit] - Maximum number of logs stored.
   * @param {(Entry)=>string} [options.format] - Custom log formatting function.
   * @param {(Entry)=>boolean} [options.notifyCallback]
   * @param {(Entry)=>boolean} [options.memoryCallback]
   */
  constructor(name, options = {}) {
    this.name = name
    this.level = options.level || DEFAULT_LOG_LEVEL
    this.limit = options.limit || MAX_LOG_NUM
    this.format = options.format ? (entry) => options.format(name, entry) : (entry) => Logger.defaultFormat(name, entry)
    this.notifyCallback = options.notifyCallback || Logger.defaultNotifyCallback
    this.memoryCallback = options.memoryCallback || Logger.defaultMemoryCallback
    return
  }

  /**
   * @returns {{index:number}}
   */
  get memory() {
    Memory._logs = Memory._logs || {}

    Memory._logs[this.name] = Memory._logs[this.name] || {}

    return Memory._logs[this.name]
  }

  /**
   * @returns {[{level:number,message:string}]}
   */
  get logs() {
    this.memory.logs = this.memory.logs || {}

    return this.memory.logs || {}
  }

  /**
   * Logs a fatal error message.
   * @param {string|function} message - The message to log.
   * @param {object} [options] - Additional log options.
   * @param {string} [options.roomName] - Room name for the log.
   * @param {number} [options.tick] - Game tick at the time of logging.
   * @param {boolean} [options.notify] - Whether to send a notification.
   * @param {boolean} [options.memory] - Whether to store log in memory.
   */
  fatal(message, options = {}) {
    this.log({ level: LOG_LEVELS.FATAL, message, ...options })
  }

  /**
   * Logs an error message.
   * @param {string|function} message - The message to log.
   * @param {object} [options] - Additional log options.
   * @param {string} [options.roomName] - Room name for the log.
   * @param {number} [options.tick] - Game tick at the time of logging.
   * @param {boolean} [options.notify] - Whether to send a notification.
   * @param {boolean} [options.memory] - Whether to store log in memory.
   */
  error(message, options = {}) {
    this.log({ level: LOG_LEVELS.ERROR, message, ...options })
  }

  /**
   * Logs a warning message.
   * @param {string|function} message - The message to log.
   * @param {object} [options] - Additional log options.
   * @param {string} [options.roomName] - Room name for the log.
   * @param {number} [options.tick] - Game tick at the time of logging.
   * @param {boolean} [options.notify] - Whether to send a notification.
   * @param {boolean} [options.memory] - Whether to store log in memory.
   */
  warn(message, options = {}) {
    this.log({ level: LOG_LEVELS.WARN, message, ...options })
  }

  /**
   * Logs an informational message.
   * @param {string|function} message - The message to log.
   * @param {object} [options] - Additional log options.
   * @param {string} [options.roomName] - Room name for the log.
   * @param {number} [options.tick] - Game tick at the time of logging.
   * @param {boolean} [options.notify] - Whether to send a notification.
   * @param {boolean} [options.memory] - Whether to store log in memory.
   */
  info(message, options = {}) {
    this.log({ level: LOG_LEVELS.INFO, message, ...options })
  }

  /**
   * Logs a debug message.
   * @param {string|function} message - The message to log.
   * @param {object} [options] - Additional log options.
   * @param {string} [options.roomName] - Room name for the log.
   * @param {number} [options.tick] - Game tick at the time of logging.
   * @param {boolean} [options.notify] - Whether to send a notification.
   * @param {boolean} [options.memory] - Whether to store log in memory.
   */
  debug(message, options = {}) {
    this.log({ level: LOG_LEVELS.DEBUG, message, ...options })
  }

  /**
   * Logs a trace message.
   * @param {string|function} message - The message to log.
   * @param {object} [options] - Additional log options.
   * @param {string} [options.roomName] - Room name for the log.
   * @param {number} [options.tick] - Game tick at the time of logging.
   * @param {boolean} [options.notify] - Whether to send a notification.
   * @param {boolean} [options.memory] - Whether to store log in memory.
   */
  trace(message, options = {}) {
    this.log({ level: LOG_LEVELS.TRACE, message, ...options })
  }

  print() {
    let num = 0
    const currentIndex = this.memory.index

    if (currentIndex === undefined) {
      return
    }

    let index = currentIndex
    let result = ""

    do {
      const entry = this.logs[index]

      index = (index + 1) % this.limit

      if (!entry) {
        continue
      }

      num++

      const text = this.format(entry)

      result += "#" + String(num).padStart(2, "0") + text + "<br>"
    } while (index !== currentIndex)

    console.log(result)
  }

  clear() {
    if (!Memory._logs) {
      return
    }

    delete Memory._logs[this.name]
  }

  /**
   * Logs a message at a specified level.
   * @param {Entry} entry - Log entry object.
   */
  log(entry) {
    if (Logger.getStreamTarget() && !Logger.getStreamTarget().includes(this.name)) {
      return
    }

    if (!entry || entry.level === undefined || entry.level > this.getLevel()) {
      return
    }

    if (typeof entry.message === "function") {
      entry.message = entry.message()
    }

    entry.timestamp = Date.now()

    entry.tick = entry.tick || Game.time

    const formattedLog = this.format(entry)

    console.log(formattedLog)

    if (entry.notify === undefined) {
      entry.notify = this.notifyCallback(entry)
    }

    if (entry.memory === undefined) {
      entry.memory = this.memoryCallback(entry)
    }

    if (entry.memory) {
      if (this.memory.index === undefined) {
        this.memory.index = 0
      }

      this.logs[this.memory.index] = entry

      this.memory.index = (this.memory.index + 1) % this.limit
    }

    if (entry.notify) {
      Game.notify(formattedLog, NOTIFY_INTERVAL)
    }
  }

  setLevel(level) {
    this.level = level
  }

  getLevel() {
    return this.level
  }
}

function roomURLescape(roomName) {
  let mapping = { N: "%4E", S: "%53", E: "%45", W: "%57" }
  let out = ""
  for (var i = 0; i < roomName.length; i++) {
    let c = roomName[i]
    out += mapping[c] || c
  }
  return out
}

function getRoomUrl(roomName) {
  const front = PATH[Game.shard.name] || PATH["DEFAULT"]

  return front + `/#!/room/${Game.shard.name}/${roomURLescape(roomName)}`
}

/**
 *
 * @returns {string} Time formatted as YYYY.MM.DD. HH:MM
 */
function getFormattedTime(timestamp) {
  function pad(number) {
    return String(number).padStart(2, "0")
  }

  const now = new Date(timestamp)
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const koreaNow = utcNow + TIME_OFFSET * 60 * 1000
  const koreaDate = new Date(koreaNow)

  const month = pad(koreaDate.getMonth() + 1)
  const date = pad(koreaDate.getDate())

  const hours = pad(koreaDate.getHours())
  const minutes = pad(koreaDate.getMinutes())

  const result = `${koreaDate.getFullYear()}.${month}.${date}. ${hours}:${minutes}`

  formattedTimeTick = Game.time

  return (formattedTime = result)
}

/**
 *
 * @param {string} text
 * @param {string} color
 * @returns
 */
function getColoredText(text, color) {
  return String(`<span style = "color: ${color}">${text}</span>`)
}

module.exports = Logger
