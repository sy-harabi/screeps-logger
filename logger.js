/**
 * Logger module for Screeps
 * Provides structured logging with different severity levels, formatting, and memory persistence.
 */

const TIME_OFFSET = 540 // UTC time offset. Adjust this to your region

const MAX_LOG_NUM = 50

const NOTIFY_INTERVAL = 60

const PATH = {
  jaysee: "http://jayseegames.localhost:8080/(http://jayseegames.com:21025)",
  shardSeason: "https://screeps.com/season",
  DEFAULT: "https://screeps.com/a",
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

class Logger {
  /**
   * Enables or disables log streaming to specific modules.
   * @param {string|string[]} [names] - Names of modules to stream logs from.
   */
  static stream(names) {
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
    delete Memory._logs
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
   * @param {object} entry - Log entry object.
   * @param {number} entry.level - Log severity level.
   * @param {string} entry.message - Log message.
   * @param {number} entry.time - Timestamp of the log.
   * @param {number} [entry.tick] - Game tick.
   * @param {string} [entry.roomName] - Room name if applicable.
   * @param {boolean} [entry.replay=true] - Whether to generate a replay link.
   * @returns {string} - Formatted log entry with colors.
   */
  static defaultFormat(name, entry) {
    const { level, message, time, tick = Game.time, roomName, replay = true } = entry

    const levelName = LEVEL_NAMES[level]

    const levelNameFormatted = levelName.padEnd(5, " ")

    const nameFormatted = name.padEnd(10, " ")

    let result = `[${time}] [${tick}] [${levelNameFormatted}] [${nameFormatted}] [${message}]`

    if (roomName) {
      const roomLink = Logger.getRoomLink(roomName)
      result += ` [${roomLink}]`

      if (replay) {
        const replayLink = Logger.getReplayLink(roomName, tick)
        result += ` [${replayLink}]`
      }
    }

    const color = LEVEL_COLORS[levelName] || LEVEL_COLORS["DEFAULT"]

    return getColoredText(result, color)
  }

  /**
   * Creates a new Logger instance.
   * @param {string} name - Logger name.
   * @param {object} [options] - Logger options.
   * @param {number} [options.level] - Minimum log level.
   * @param {number} [options.limit] - Maximum number of logs stored.
   * @param {({level:number,message:string})=>string} [options.format] - Custom log formatting function.
   */
  constructor(name, options = {}) {
    this.name = name
    this.level = options.level || DEFAULT_LOG_LEVEL
    this.limit = options.limit || MAX_LOG_NUM
    this.format = options.format ? (entry) => options.format(name, entry) : (entry) => Logger.defaultFormat(name, entry)
    return
  }

  /**
   * @returns {{index:number}}
   */
  get memory() {
    if (!Memory._logs) {
      Memory._logs = {}
    }

    if (!Memory._logs[this.name]) {
      Memory._logs[this.name] = {}
    }

    return Memory._logs[this.name]
  }

  /**
   * Logs a fatal error message.
   * @param {string|function} message - The message to log.
   * @param {object} [options] - Additional log options.
   * @param {string} [options.roomName] - Room name for the log.
   * @param {number} [options.tick] - Game tick at the time of logging.
   * @param {boolean} [options.notify] - Whether to send a notification.
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
      const entry = this.memory[index]

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
   * @param {object} entry - Log entry object.
   * @param {number} entry.level - Log severity level.
   * @param {string|function} entry.message - Log message or function returning a message.
   * @param {string} [entry.roomName] - Room name for the log.
   * @param {number} [entry.tick] - Game tick.
   * @param {boolean} [entry.notify] - Whether to send a notification.
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

    entry.time = getFormattedTime()

    entry.tick = entry.tick || Game.time

    if (entry.notify === undefined) {
      entry.notify = entry.level <= NOTIFY_LOG_LEVEL
    }

    if (this.memory.index === undefined) {
      this.memory.index = 0
    }

    this.memory[this.memory.index] = entry

    this.memory.index = (this.memory.index + 1) % this.limit

    const formattedLog = this.format(entry)

    console.log(formattedLog)

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

  return front + `/#!/room/${Game.shard.name}/${roomName}`
}

let formattedTimeTick

let formattedTime

/**
 *
 * @returns {string} Time formatted as YYYY.MM.DD. HH:MM
 */
function getFormattedTime() {
  if (formattedTimeTick && formattedTimeTick === Game.time && formattedTime) {
    return formattedTime
  }

  function pad(number) {
    return String(number).padStart(2, "0")
  }

  const now = new Date()
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
