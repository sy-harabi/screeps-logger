const TIME_OFFSET = 540 // UTC time offset. Adjust this to your region

const MAX_LOG_NUM = 50

const NOTIFY_INTERVAL = 60

const PATH = {
  jaysee: "http://jayseegames.localhost:8080/(http://jayseegames.com:21025)",
  shardSeason: "https://screeps.com/season",
  DEFAULT: "https://screeps.com/a",
}

let a

const CATEGORY = ["general", "economy", "combat", "defense", "resource", "movement", "events", "spawn", "construct"]

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

const logger = {
  get logs() {
    if (!Memory._loggerLogs) {
      Memory._loggerLogs = { index: 0 }
    }
    return Memory._loggerLogs
  },

  /**
   *
   * @param {number} level
   */
  setLevel(level) {
    Memory._loggerLogLevel = level
  },

  getLevel() {
    if (Memory._loggerLogLevel === undefined) {
      Memory._loggerLogLevel = DEFAULT_LOG_LEVEL
    }

    return Memory._loggerLogLevel
  },

  logError(error, description, roomName) {
    const message = error.stack

    let terminalOnly = Object.values(logger.logs).some((log) => log.message === message)

    loggerLog(LOG_LEVELS.ERROR, description, message, { roomName, notify: true, terminalOnly })
  },
}

function createCategoryLogger(category) {
  return {
    fatal(message, options = {}) {
      return loggerLog(LOG_LEVELS.FATAL, category, message, options)
    },

    error(message, options = {}) {
      return loggerLog(LOG_LEVELS.ERROR, category, message, options)
    },

    warn(message, options = {}) {
      return loggerLog(LOG_LEVELS.WARN, category, message, options)
    },

    info(message, options = {}) {
      return loggerLog(LOG_LEVELS.INFO, category, message, options)
    },

    debug(message, options = {}) {
      return loggerLog(LOG_LEVELS.DEBUG, category, message, options)
    },

    trace(message, options = {}) {
      return loggerLog(LOG_LEVELS.TRACE, category, message, options)
    },
  }
}

CATEGORY.forEach((category) => {
  logger[category] = createCategoryLogger(category)
})

/**
 *
 * @param {number} level
 * @param {string} category
 * @param {string} message
 * @param {object} options
 * @param {string|undefined} options.roomName - roomName that event happend. If exists, hyperlink to room or history is attached to log
 * @param {boolean|false} options.notify - If true, notify the log via email. If undefined, notify if level is warn or more important
 * @param {boolean|false} options.terminalOnly - If true, don't push log into Memory.
 * @param {number|undefined} options.tick - Replay start tick. Default is the very tick that this function is called.
 */
function loggerLog(level, category, message, options = {}) {
  if (level > logger.getLevel()) {
    return
  }

  const roomName = options.roomName

  const notify = options.notify !== undefined ? options.notify : level <= NOTIFY_LOG_LEVEL

  const terminalOnly = options.terminalOnly || false

  const time = getFormattedTime()
  const tick = options.tick || Game.time

  const logEntry = {
    level,
    category,
    time,
    tick,
    message,
    roomName,
  }

  console.log(formatLogEntry(logEntry))

  if (terminalOnly) {
    return
  }

  if (logger.logs.index === undefined) {
    logger.logs.index = 0
  }

  logger.logs[logger.logs.index] = logEntry

  logger.logs.index = (logger.logs.index + 1) % MAX_LOG_NUM

  if (notify) {
    Game.notify(formatLogEntry(logEntry, true), NOTIFY_INTERVAL)
  }
}

/**
 *
 * @param {object} entry
 * @param {number} entry.level
 * @param {string} entry.category
 * @param {number} entry.time
 * @param {number} entry.tick
 * @param {string} entry.message
 * @param {string|undefined} entry.roomName
 */
function formatLogEntry(entry, replay = false) {
  const { level, category, time, tick, message, roomName } = entry

  const levelName = LEVEL_NAMES[level]

  const levelNameFormatted = levelName.padEnd(5, " ")

  const categoryFormatted = category.padEnd(10, " ")

  let result = `[${time}] [${tick}] [${levelNameFormatted}] [${categoryFormatted}]`

  result += ` [${message}]`

  if (roomName) {
    if (replay) {
      const replayLink = getReplayLink(roomName, tick)
      result += `[${roomName}] [${replayLink}]`
    } else {
      const roomLink = getRoomLink(roomName)
      result += ` [${roomLink}]`
    }
  }

  const color = LEVEL_COLORS[levelName] || LEVEL_COLORS["DEFAULT"]

  return getColoredText(result, color)
}

// getReplayLink and roomURLescape are from MrFaul

function getReplayLink(roomName, tick = Game.time, msg = "replay") {
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

function roomURLescape(roomName) {
  let mapping = { N: "%4E", S: "%53", E: "%45", W: "%57" }
  let out = ""
  for (var i = 0; i < roomName.length; i++) {
    let c = roomName[i]
    out += mapping[c] || c
  }
  return out
}

function getRoomLink(roomName) {
  const url = getRoomUrl(roomName)
  return `<a href="${url}" target="_blank">${roomName}</a>`
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

global.setLogLevel = function (level) {
  if (!Object.values(LOG_LEVELS).includes(level)) {
    throw new Error(`level should be an integer from 0 to ${Object.values(LOG_LEVELS).length - 1}`)
  }

  logger.setLevel(level)
}

global.log = function (category) {
  let num = 0

  const numLogs = MAX_LOG_NUM

  const currentIndex = logger.logs.index

  let index = currentIndex

  let result = ""

  do {
    const logEntry = logger.logs[index]

    index = (index + 1) % numLogs

    if (!logEntry) {
      continue
    }

    if (category && logEntry.category !== category) {
      continue
    }

    num++

    const text = formatLogEntry(logEntry, true)

    result += "#" + String(num).padStart(2, "0") + text + "<br>"
  } while (index !== currentIndex)

  return result
}

module.exports = logger
