/* eslint-disable import/no-extraneous-dependencies */
import { IDatabaseDriver, Connection, MikroORM } from '@mikro-orm/core';
import { MikroORM as MySQLMikroORM } from '@mikro-orm/mysql';
import { MikroORM as PostgreSQLMikroORM } from '@mikro-orm/postgresql';
import { MikroORM as SQLiteMikroORM } from '@mikro-orm/sqlite';
import { MikroORM as MongoMikroORM } from '@mikro-orm/mongodb';

import DatabaseConnector from './database.connector';

import type { MikroConnectorOptions } from './mikro.connection.options';

class MikroConnector<
  D extends IDatabaseDriver<Connection> = IDatabaseDriver<Connection>
> extends DatabaseConnector {
  orm!: MikroORM<D>;

  async init(options: MikroConnectorOptions<D>): Promise<MikroORM | Error> {
    const { type, ...rest } = options;

    /* istanbul ignore next */
    switch (type) {
      case 'mysql':
        this.orm = await MySQLMikroORM.init<D>(rest);
        break;

      case 'sqlite':
        this.orm = await SQLiteMikroORM.init<D>(rest);
        break;

      case 'mongo':
        this.orm = await MongoMikroORM.init<D>(rest);
        break;

      case 'postgresql':
        this.orm = await PostgreSQLMikroORM.init<D>(rest);
        break;

      default:
        throw new Error(`Unknown database type ${type}`);
    }

    return this.orm;
  }

  getORM(): MikroORM<D> {
    return this.orm;
  }
}

export default MikroConnector;
