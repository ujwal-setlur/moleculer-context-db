import { IDatabaseDriver, Options, Connection } from '@mikro-orm/core';
import type { MikroOrmDBType } from './database.types';

export type MikroConnectorOptions<
  D extends IDatabaseDriver<Connection> = IDatabaseDriver<Connection>
> = Options<D> & {
  type: MikroOrmDBType;
};
