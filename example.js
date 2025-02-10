const Logger = require("./screeps-logger")

const errorLogger = new Logger("error")

function logError(error, options = {}) {
  if (!(error instanceof Error)) {
    errorLogger.error(`Invalid error object: ${JSON.stringify(error)}`, options)
    return
  }

  const message = `${error.message}\nStack: ${error.stack}`

  if (Object.values(errorLogger.logs).some((log) => log.message === message)) {
    return
  }

  errorLogger.error(message, options)
}

function safeExecute(fn) {
  try {
    fn()
  } catch (err) {
    logError(err)
  }
}

const NAMES = {
  GENERAL: "general",
  EVENT: "event",
  ERROR: "error",
  EXCHANGE: "exchange",
  MARKET: "market",
}

const general = new Logger("general")

const event = new Logger("event")

const exchange = new Logger("exchange")

const market = new Logger("market")

const loggers = {
  NAMES,
  general,
  event,
  exchange,
  market,
}

global.printLog = function (name) {
  const logger = loggers[name]

  if (logger) {
    logger.print()
  }
}

global.clearLog = function (name) {
  if (name === undefined) {
    Logger.clearAll()
  }

  const logger = loggers[name]

  if (logger) {
    logger.clear()
  }
}

global.streamLog = function (names) {
  Logger.setStream(names)
}

module.exports = { safeExecute, loggers }
