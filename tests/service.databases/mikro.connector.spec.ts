import MikroConnector from '../../src/service.databases/mikro.connector';
import type { MikroOrmDBType } from '../../src/service.databases/database.types';

describe('MikroConnector', () => {
  test('it throws an error on init with invalid dbType', async () => {
    const connector = new MikroConnector();
    await expect(
      connector.init({
        type: 'invalid' as MikroOrmDBType,
        dbName: 'test',
        clientUrl: 'test',
        entities: []
      })
    ).rejects.toThrow();
  });
});
