/* eslint-disable import/no-extraneous-dependencies */
/**
 * Entry point for unit test.
 * Uses the moleculer microservices framework.
 *
 * Copyright Byte Technology 2020. All rights reserved.
 */

import { ServiceBroker, Service } from 'moleculer';
import { MongoDriver } from '@mikro-orm/mongodb';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import { DatabaseContextManager, MikroConnector } from '../../src';
import MongoTestEntity from '../entities/mongo/test.entity';

import SampleService from '../service/mongo/sample.service';

const ChannelMiddleware = require('@moleculer/channels').Middleware;
const TracingMiddleware = require('@moleculer/channels').Tracing;

describe('Mongo unit tests', () => {
  let broker: ServiceBroker;
  let service: Service;
  let mongod: MongoMemoryReplSet;
  let connector: MikroConnector<MongoDriver>;
  let entityId: string;

  beforeAll(async () => {
    // create a new moleculer service broker
    broker = new ServiceBroker({
      logLevel: 'fatal',
      middlewares: [
        ChannelMiddleware({
          adapter: 'Fake',
          context: true
        }),
        TracingMiddleware()
      ]
    });

    // create an in-memory mongodb instance
    mongod = await MongoMemoryReplSet.create({
      replSet: { storageEngine: 'wiredTiger' }
    });
    await mongod.waitUntilRunning();
    const uri = mongod.getUri();

    // create our DatabaseContext with MikroConnector
    connector = new MikroConnector<MongoDriver>();
    await connector.init({
      type: 'mongo',
      clientUrl: uri,
      entities: [MongoTestEntity],
      cache: {
        enabled: false
      },
      implicitTransactions: true
    });
    await connector.getORM().getSchemaGenerator().createSchema();
    const dbContext = new DatabaseContextManager(connector);
    // add the db middleware to the broker
    broker.middlewares.add(dbContext.middleware());

    // create our service and start the broker
    service = broker.createService(SampleService);
    await broker.start();
    await broker.waitForServices('sample');
  });

  afterAll(async () => {
    await broker.destroyService(service);
    await broker.stop();
    await connector.getORM().close();
    await mongod.stop();
  });

  test('Ping test', async () => {
    // call an action without a parameter object
    const response: string = await broker.call('sample.ping');
    expect(response).toBe('Hello World!');
  });

  test('Test database entity creation', async () => {
    // create a sample entity
    entityId = await broker.call(
      'sample.addTestEntity',
      {
        name: 'John Doe'
      },
      { caller: 'jest' }
    );

    expect(entityId).toBeTruthy();
  });

  test('Test database entity fetch by id', async () => {
    // create a sample entity
    const entityName = await broker.call(
      'sample.getTestEntityById',
      {
        id: entityId
      },
      { caller: 'jest' }
    );

    expect(entityName).toBe('John Doe');
  });

  test('Test database entity fetch by name', async () => {
    // create a sample entity
    const theId = await broker.call(
      'sample.getTestEntityByName',
      {
        name: 'John Doe'
      },
      { caller: 'jest' }
    );

    expect(theId).toBeTruthy();
  });

  test('Test invalid database entity fetch by id', async () => {
    // create a sample entity
    await expect(
      broker.call(
        'sample.getTestEntityById',
        {
          id: '1234'
        },
        { caller: 'jest' }
      )
    ).rejects.toThrow();
  });

  test('Test invalid database entity fetch by name', async () => {
    // create a sample entity
    await expect(
      broker.call(
        'sample.getTestEntityByName',
        {
          name: 'Jane Doe'
        },
        { caller: 'jest' }
      )
    ).rejects.toThrow();
  });

  test('Generate valid sample event', async () => {
    // create a spy to look at events
    const spy = jest.spyOn(service, 'eventTester');

    await broker.emit('sample.testEntityEvent', {
      name: 'John Doe'
    });

    expect(spy).toBeCalledTimes(1);
  });

  test('Generate valid sample message', async () => {
    // create a spy to look at messages
    const spy = jest.spyOn(service, 'eventTester');

    await broker.sendToChannel('sample.testEntityMessage', {
      name: 'John Doe'
    });

    expect(spy).toBeCalledTimes(1);
  });
});
