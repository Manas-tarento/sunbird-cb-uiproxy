// tslint:disable-next-line: no-commented-code
// import cassandraDriver from 'cassandra-driver'
import CassandraStore from 'cassandra-session-store'
// tslint:disable-next-line: no-commented-code
// import CassandraStore from 'cassandra-store'
import expressSession from 'express-session'
import { CONSTANTS } from '../utils/env'
import { logError } from '../utils/logger'
const expressCassandra = require('express-cassandra')

const _ = require('lodash')

let sessionConfig: expressSession.SessionOptions
const consistency = getConsistencyLevel(CONSTANTS.PORTAL_CASSANDRA_CONSISTENCY_LEVEL)
const replicationStrategy = getReplicationStrategy(CONSTANTS.PORTAL_CASSANDRA_REPLICATION_STRATEGY)

// tslint:disable-next-line: no-commented-code
// const cassandraClientOptions: cassandraDriver.ClientOptions = {
//   contactPoints: getIPList(),
//   keyspace: 'portal',
//   queryOptions: {
//     consistency,
//     prepare: true,
//   },
// }

function getIPList() {
  return CONSTANTS.CASSANDRA_IP.split(',')
}

// tslint:disable-next-line: no-commented-code
// if (
//   CONSTANTS.IS_CASSANDRA_AUTH_ENABLED &&
//   CONSTANTS.CASSANDRA_USERNAME &&
//   CONSTANTS.CASSANDRA_PASSWORD
// ) {
//   cassandraClientOptions.authProvider = new cassandraDriver.auth.PlainTextAuthProvider(
//     CONSTANTS.CASSANDRA_USERNAME,
//     CONSTANTS.CASSANDRA_PASSWORD
//   )
// }

export function getSessionConfig(
  isPersistant = true
): expressSession.SessionOptions {
  if (!sessionConfig) {
    sessionConfig = {
      cookie: {
        maxAge: CONSTANTS.KEYCLOAK_SESSION_TTL,
      },
      resave: false,
      saveUninitialized: false,
      secret: '927yen45-i8j6-78uj-y8j6g9rf56hu',
      store: isPersistant
        ? new CassandraStore({
          client: null,
          clientOptions: {
            contactPoints: getIPList(),
            keyspace: 'portal',
            queryOptions: {
              consistency,
              prepare: true,
            },
          },
          ormOptions: {
            defaultReplicationStrategy: replicationStrategy,
            migration: 'safe',
          },
          table: 'sessions',
        })
        : new expressSession.MemoryStore(),
    }
  }
  return sessionConfig
}

// tslint:disable-next-line: no-any
function getConsistencyLevel(consistencyParam: any) {
  // tslint:disable-next-line: max-line-length
  return (consistencyParam && _.get(expressCassandra, `consistencies.${consistencyParam}`) ? _.get(expressCassandra, `consistencies.${consistencyParam}`) :  expressCassandra.consistencies.one)
}

// tslint:disable-next-line: no-any
function getReplicationStrategy(replicationStrategyParam: any) {
  try {
    return JSON.parse(replicationStrategyParam)
  } catch (e) {
    logError(JSON.stringify({msg: 'cassandraUtil : Error in getReplicationStrategy', error: e}))
    return {class: 'SimpleStrategy', replication_factor: 1}
  }
}
