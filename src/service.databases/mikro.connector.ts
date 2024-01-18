/* eslint-disable no-case-declarations */
/* eslint-disable import/no-extraneous-dependencies */
import { IDatabaseDriver, Connection, MikroORM } from '@mikro-orm/core';

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
        const { MikroORM: MySQLMikroORM } = await import('@mikro-orm/mysql');
        this.orm = await MySQLMikroORM.init<D>(rest);
        break;

      case 'sqlite':
        const { MikroORM: SQLiteMikroORM } = await import('@mikro-orm/sqlite');
        this.orm = await SQLiteMikroORM.init<D>(rest);
        break;

      case 'mongo':
        const { MikroORM: MongoMikroORM } = await import('@mikro-orm/mongodb');
        this.orm = await MongoMikroORM.init<D>(rest);
        break;

      case 'postgresql':
        const { MikroORM: PostgreSQLMikroORM } = await import(
          '@mikro-orm/postgresql'
        );
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
