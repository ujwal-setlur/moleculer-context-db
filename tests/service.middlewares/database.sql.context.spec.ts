import { Service, ServiceBroker } from 'moleculer';
import * as uuid from 'uuid';

import DatabaseContextManager from '../../src/service.middlewares/database.context';
import MikroConnector from '../../src/service.databases/mikro.connector';
import MoleculerMikroContext from '../../src/service.databases/moleculer.mikro.context';
import TestEntity from '../entities/sql/test.entity';

describe('DatabaseContext', () => {
  describe('Middleware With Connector Set', () => {
    let dbContextManager: DatabaseContextManager;
    let connector: MikroConnector;
    let spy: jest.SpyInstance;
    const broker = new ServiceBroker({ logLevel: 'fatal' });
    const endpoint = {
      broker,
      id: 'ABC',
      node: {},
      local: true,
      state: true
    };
    beforeAll(async () => {
      connector = new MikroConnector();
      dbContextManager = new DatabaseContextManager(connector);
      await connector.init({
        type: 'sqlite',
        dbName: ':memory:',
        entities: [TestEntity]
      });
      spy = jest.spyOn(connector.getORM().em, 'fork');
      const generator = connector.getORM().getSchemaGenerator();
      await generator.dropSchema();
      await generator.createSchema();
    });
    afterAll(async () => {
      const generator = connector.getORM().getSchemaGenerator();
      await generator.dropSchema();
      await connector.getORM().close();
    });
    test(`contextWrapper() forks the entity manager`, async () => {
      const contextWrapper = dbContextManager.middleware().localAction(
        async function testContextForNewEntityManager(
          this: Service,
          ctx: MoleculerMikroContext
        ) {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(ctx.entityManager.isInTransaction()).toBeFalsy(); // we should not be in a transaction
          return Promise.resolve();
        } as any,
        {} as any
      );
      await contextWrapper(new MoleculerMikroContext(broker, endpoint));
    });
    describe('wrapAction', () => {
      let localUuid: string = '';
      const testEntityName = 'testing';
      const testEntity: TestEntity = new TestEntity();
      beforeAll(() => {
        localUuid = uuid.v4();
        testEntity.uuid = localUuid;
        testEntity.date = new Date();
        testEntity.name = testEntityName;
      });
      afterEach(async () => {
        await connector
          .getORM()
          .em.nativeDelete(TestEntity, { uuid: localUuid });
      });
      test(`all changes are made when there are no errors`, async () => {
        const contextWrapper = dbContextManager.middleware().localAction(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            return Promise.resolve();
          } as any,
          {} as any
        );
        try {
          await contextWrapper(new MoleculerMikroContext(broker, endpoint));
          const localTestEntity: TestEntity | null = await connector
            .getORM()
            .em.fork()
            .findOne(TestEntity, { name: testEntityName });
          if (localTestEntity !== null) {
            expect(localTestEntity.uuid).toEqual(localUuid);
          } else {
            expect(1).toEqual(0);
          }
        } catch (e) {
          expect(e).toBeFalsy();
        }
      });
      test(`no changes are made when there are invalid changes`, async () => {
        const contextWrapper = dbContextManager.middleware().localAction(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            const invalidTestEntity: TestEntity = new TestEntity();
            ctx.entityManager.persist(invalidTestEntity);
            return Promise.resolve();
          } as any,
          {} as any
        );
        try {
          await contextWrapper(new MoleculerMikroContext(broker, endpoint));
        } catch (e) {
          expect(e).toBeTruthy();
        }
        const fetchedTestEntity: TestEntity | null = await connector
          .getORM()
          .em.fork()
          .findOne(TestEntity, { name: testEntityName });
        expect(fetchedTestEntity).toBeNull();
      });
      test(`no changes are made when the promise rejects`, async () => {
        const contextWrapper = dbContextManager.middleware().localAction(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            return Promise.reject(new Error('Test Exception'));
          } as any,
          {} as any
        );
        const mikroContext = new MoleculerMikroContext(broker, endpoint);
        await expect(contextWrapper(mikroContext)).rejects.toThrow();

        const fetchedTestEntity: TestEntity | null = await connector
          .getORM()
          .em.fork()
          .findOne(TestEntity, { name: testEntityName });
        expect(fetchedTestEntity).toBeNull();
      });
    });
    describe('wrapEvent', () => {
      let localUuid: string = '';
      const testEntityName = 'testing';
      const testEntity: TestEntity = new TestEntity();
      beforeAll(() => {
        localUuid = uuid.v4();
        testEntity.uuid = localUuid;
        testEntity.date = new Date();
        testEntity.name = testEntityName;
      });
      afterEach(async () => {
        await connector
          .getORM()
          .em.nativeDelete(TestEntity, { uuid: localUuid });
      });
      test(`all changes are made when there are no errors`, async () => {
        const contextWrapper = dbContextManager.middleware().localEvent(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            return Promise.resolve();
          } as any,
          {} as any
        );
        try {
          await contextWrapper(new MoleculerMikroContext(broker, endpoint));
          const localTestEntity: TestEntity | null = await connector
            .getORM()
            .em.fork()
            .findOne(TestEntity, { name: testEntityName });
          if (localTestEntity !== null) {
            expect(localTestEntity.uuid).toEqual(localUuid);
          } else {
            expect(1).toEqual(0);
          }
        } catch (e) {
          expect(e).toBeFalsy();
        }
      });
      test(`no changes are made when there are invalid changes`, async () => {
        const contextWrapper = dbContextManager.middleware().localEvent(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            const invalidTestEntity: TestEntity = new TestEntity();
            ctx.entityManager.persist(invalidTestEntity);
            return Promise.resolve();
          } as any,
          {} as any
        );
        try {
          await contextWrapper(new MoleculerMikroContext(broker, endpoint));
        } catch (e) {
          expect(e).toBeTruthy();
        }
        const fetchedTestEntity: TestEntity | null = await connector
          .getORM()
          .em.fork()
          .findOne(TestEntity, { name: testEntityName });
        expect(fetchedTestEntity).toBeNull();
      });
      test(`no changes are made when the promise rejects`, async () => {
        const contextWrapper = dbContextManager.middleware().localEvent(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            return Promise.reject(new Error('Test Exception'));
          } as any,
          {} as any
        );
        const mikroContext = new MoleculerMikroContext(broker, endpoint);

        await expect(contextWrapper(mikroContext)).rejects.toThrow();

        const fetchedTestEntity: TestEntity | null = await connector
          .getORM()
          .em.fork()
          .findOne(TestEntity, { name: testEntityName });
        expect(fetchedTestEntity).toBeNull();
      });
    });
    describe('wrapChannel', () => {
      let localUuid: string = '';
      const testEntityName = 'testing';
      const testEntity: TestEntity = new TestEntity();
      beforeAll(() => {
        localUuid = uuid.v4();
        testEntity.uuid = localUuid;
        testEntity.date = new Date();
        testEntity.name = testEntityName;
      });
      afterEach(async () => {
        await connector
          .getORM()
          .em.nativeDelete(TestEntity, { uuid: localUuid });
      });
      test(`all changes are made when there are no errors`, async () => {
        const contextWrapper = dbContextManager.middleware().localChannel(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            return Promise.resolve();
          } as any,
          {} as any
        );
        try {
          await contextWrapper(new MoleculerMikroContext(broker, endpoint));
          const localTestEntity: TestEntity | null = await connector
            .getORM()
            .em.fork()
            .findOne(TestEntity, { name: testEntityName });
          if (localTestEntity !== null) {
            expect(localTestEntity.uuid).toEqual(localUuid);
          } else {
            expect(1).toEqual(0);
          }
        } catch (e) {
          expect(e).toBeFalsy();
        }
      });
      test(`no changes are made when there are invalid changes`, async () => {
        const contextWrapper = dbContextManager.middleware().localChannel(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            const invalidTestEntity: TestEntity = new TestEntity();
            ctx.entityManager.persist(invalidTestEntity);
            return Promise.resolve();
          } as any,
          {} as any
        );
        try {
          await contextWrapper(new MoleculerMikroContext(broker, endpoint));
        } catch (e) {
          expect(e).toBeTruthy();
        }
        const fetchedTestEntity: TestEntity | null = await connector
          .getORM()
          .em.fork()
          .findOne(TestEntity, { name: testEntityName });
        expect(fetchedTestEntity).toBeNull();
      });
      test(`no changes are made when the promise rejects`, async () => {
        const contextWrapper = dbContextManager.middleware().localChannel(
          function testChangesArePersisted(
            this: Service,
            ctx: MoleculerMikroContext
          ) {
            ctx.entityManager.persist(testEntity);
            return Promise.reject(new Error('Test Exception'));
          } as any,
          {} as any
        );
        const mikroContext = new MoleculerMikroContext(broker, endpoint);

        await expect(contextWrapper(mikroContext)).rejects.toThrow();

        const fetchedTestEntity: TestEntity | null = await connector
          .getORM()
          .em.fork()
          .findOne(TestEntity, { name: testEntityName });
        expect(fetchedTestEntity).toBeNull();
      });
    });
  });
});
