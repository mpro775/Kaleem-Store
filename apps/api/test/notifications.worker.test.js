const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  extractRetryCount,
  handleMessage,
  publishToRetryQueue,
  resolveQueueNames,
} = require('../dist/workers/notifications.worker');

describe('notifications.worker helpers', () => {
  it('extracts retry count from headers', () => {
    const asNumber = buildMessage({ routingKey: 'order.created', headers: { 'x-retry-count': 2 } });
    const asString = buildMessage({
      routingKey: 'order.created',
      headers: { 'x-retry-count': '3' },
    });
    const invalid = buildMessage({
      routingKey: 'order.created',
      headers: { 'x-retry-count': 'bad' },
    });

    assert.equal(extractRetryCount(asNumber), 2);
    assert.equal(extractRetryCount(asString), 3);
    assert.equal(extractRetryCount(invalid), 0);
  });

  it('routes retries to status queue for order.status.changed', () => {
    const channel = createChannel();
    const message = buildMessage({ routingKey: 'order.status.changed' });

    publishToRetryQueue(channel, message, 'order.status.changed', 2, 15000, defaultQueues());

    assert.equal(channel.publishCalls.length, 1);
    const publishCall = channel.publishCalls[0];
    assert.equal(publishCall.exchange, '');
    assert.equal(publishCall.routingKey, 'notifications.order-status.retry');
    assert.equal(publishCall.options.expiration, '15000');
    assert.equal(publishCall.options.headers['x-retry-count'], 2);
    assert.equal(publishCall.options.headers['x-original-routing-key'], 'order.status.changed');
  });

  it('routes retries to inventory queue for inventory.low_stock', () => {
    const channel = createChannel();
    const message = buildMessage({ routingKey: 'inventory.low_stock' });

    publishToRetryQueue(channel, message, 'inventory.low_stock', 1, 12000, defaultQueues());

    assert.equal(channel.publishCalls.length, 1);
    const publishCall = channel.publishCalls[0];
    assert.equal(publishCall.exchange, '');
    assert.equal(publishCall.routingKey, 'notifications.inventory.retry');
    assert.equal(publishCall.options.expiration, '12000');
    assert.equal(publishCall.options.headers['x-retry-count'], 1);
    assert.equal(publishCall.options.headers['x-original-routing-key'], 'inventory.low_stock');
  });

  it('acks processed message without retry', async () => {
    const channel = createChannel();
    const message = buildMessage({
      routingKey: 'order.created',
      headers: { 'x-retry-count': 1 },
      payload: { orderId: 'o-1', storeId: 's-1' },
    });

    const notificationsService = {
      processCalls: [],
      async processEvent(input) {
        this.processCalls.push(input);
      },
      async markFailure() {
        throw new Error('markFailure should not be called');
      },
    };

    await handleMessage({
      channel,
      message,
      maxRetries: 3,
      retryDelayMs: 10000,
      notificationsService,
      queues: defaultQueues(),
    });

    assert.equal(notificationsService.processCalls.length, 1);
    assert.equal(notificationsService.processCalls[0].attempts, 2);
    assert.equal(channel.ackCalls, 1);
    assert.equal(channel.publishCalls.length, 0);
  });

  it('requeues message when retry budget remains', async () => {
    const channel = createChannel();
    const message = buildMessage({
      routingKey: 'order.created',
      payload: { orderId: 'o-1', storeId: 's-1' },
    });

    const notificationsService = {
      async processEvent() {
        throw new Error('temporary failure');
      },
      async markFailure() {
        throw new Error('markFailure should not be called');
      },
    };

    await handleMessage({
      channel,
      message,
      maxRetries: 3,
      retryDelayMs: 10000,
      notificationsService,
      queues: defaultQueues(),
    });

    assert.equal(channel.ackCalls, 1);
    assert.equal(channel.publishCalls.length, 1);
    const retryCall = channel.publishCalls[0];
    assert.equal(retryCall.routingKey, 'notifications.order-created.retry');
    assert.equal(retryCall.options.headers['x-retry-count'], 1);
    assert.equal(retryCall.options.headers['x-original-routing-key'], 'order.created');
    assert.equal(retryCall.options.expiration, '10000');
  });

  it('moves message to dlq after retries exhausted', async () => {
    const channel = createChannel();
    const message = buildMessage({
      routingKey: 'order.created',
      headers: { 'x-retry-count': 2 },
      payload: { orderId: 'o-1', storeId: 's-1' },
    });

    const notificationsService = {
      failures: [],
      async processEvent() {
        throw new Error('processing failed');
      },
      async markFailure(input) {
        this.failures.push(input);
      },
    };

    await handleMessage({
      channel,
      message,
      maxRetries: 2,
      retryDelayMs: 10000,
      notificationsService,
      queues: defaultQueues(),
    });

    assert.equal(channel.ackCalls, 1);
    assert.equal(channel.publishCalls.length, 1);
    const dlqCall = channel.publishCalls[0];
    assert.equal(dlqCall.routingKey, 'notifications.order-events.dlq');
    assert.equal(dlqCall.options.headers['x-retry-count'], 3);
    assert.equal(dlqCall.options.headers['x-original-routing-key'], 'order.created');
    assert.equal(dlqCall.options.headers['x-failed-reason'], 'processing failed');

    assert.equal(notificationsService.failures.length, 1);
    assert.equal(notificationsService.failures[0].attempts, 3);
    assert.equal(notificationsService.failures[0].errorMessage, 'processing failed');
  });

  it('captures raw payload when json parsing fails on final attempt', async () => {
    const channel = createChannel();
    const message = {
      content: Buffer.from('{bad-json'),
      fields: { routingKey: 'order.status.changed' },
      properties: { headers: { 'x-retry-count': 1 } },
    };

    const notificationsService = {
      failures: [],
      async processEvent() {
        throw new Error('processEvent should not run for invalid json');
      },
      async markFailure(input) {
        this.failures.push(input);
      },
    };

    await handleMessage({
      channel,
      message,
      maxRetries: 1,
      retryDelayMs: 10000,
      notificationsService,
      queues: defaultQueues(),
    });

    assert.equal(notificationsService.failures.length, 1);
    assert.equal(notificationsService.failures[0].payload.raw, '{bad-json');
    assert.equal(channel.publishCalls.length, 1);
    assert.equal(channel.publishCalls[0].routingKey, 'notifications.order-events.dlq');
  });

  it('resolves queue names from config defaults and overrides', () => {
    const config = {
      get(key, defaultValue) {
        if (key === 'NOTIFICATIONS_MAIN_QUEUE') {
          return 'main.override';
        }
        return defaultValue;
      },
    };

    const queues = resolveQueueNames(config);
    assert.equal(queues.mainQueue, 'main.override');
    assert.equal(queues.dlqQueue, 'notifications.order-events.dlq');
    assert.equal(queues.retryCreatedQueue, 'notifications.order-created.retry');
    assert.equal(queues.retryStatusQueue, 'notifications.order-status.retry');
    assert.equal(queues.retryInventoryQueue, 'notifications.inventory.retry');
  });
});

function defaultQueues() {
  return {
    mainQueue: 'notifications.order-events',
    dlqQueue: 'notifications.order-events.dlq',
    retryCreatedQueue: 'notifications.order-created.retry',
    retryStatusQueue: 'notifications.order-status.retry',
    retryInventoryQueue: 'notifications.inventory.retry',
  };
}

function buildMessage({ routingKey, payload = { orderId: 'o-1' }, headers = {} }) {
  return {
    content: Buffer.from(JSON.stringify(payload)),
    fields: { routingKey },
    properties: { headers },
  };
}

function createChannel() {
  return {
    ackCalls: 0,
    publishCalls: [],
    ack() {
      this.ackCalls += 1;
    },
    publish(exchange, routingKey, content, options) {
      this.publishCalls.push({ exchange, routingKey, content, options });
      return true;
    },
  };
}
