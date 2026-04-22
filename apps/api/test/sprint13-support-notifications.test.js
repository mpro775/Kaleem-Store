require('reflect-metadata');

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { SupportService } = require('../dist/support/support.service');
const { NotificationsService } = require('../dist/notifications/notifications.service');

describe('Sprint 13 support + notifications', () => {
  it('creates store inbox notification when customer creates B2C support ticket', async () => {
    const ticket = {
      id: 'ticket-1',
      store_id: 'store-1',
      scope: 'b2c',
      source: 'customer_portal',
      subject: 'Where is my order?',
      description: null,
      status: 'open',
      priority: 'medium',
      requester_type: 'customer',
      requester_customer_id: 'customer-1',
      requester_store_user_id: null,
      requester_label: 'John',
      requester_customer_name: 'John',
      requester_store_user_name: null,
      assigned_to_type: null,
      assigned_to_store_user_id: null,
      assigned_to_label: null,
      assigned_store_user_name: null,
      sla_first_response_due_at: new Date(),
      sla_resolve_due_at: new Date(),
      first_response_at: null,
      resolved_at: null,
      closed_at: null,
      last_message_at: new Date(),
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    };

    const supportRepository = {
      async findSlaPolicy() {
        return { first_response_minutes: 120, resolution_minutes: 2880 };
      },
      async createTicket() {
        return ticket;
      },
      async insertMessage() {},
      async insertTicketEvent() {},
    };

    const notificationCalls = [];
    const notificationsService = {
      async createInboxNotification(input) {
        notificationCalls.push(input);
        return input;
      },
    };

    const service = new SupportService(
      supportRepository,
      notificationsService,
      { async log() {} },
    );

    await service.createTicketByCustomer(
      {
        id: 'customer-1',
        storeId: 'store-1',
        phone: '700000000',
        email: 'john@example.com',
        fullName: 'John',
        sessionId: 'sess-1',
      },
      {
        priority: 'medium',
        subject: 'Where is my order?',
        message: 'Need an update please.',
      },
      {
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        requestId: 'req-1',
      },
    );

    assert.equal(notificationCalls.length, 1);
    assert.equal(notificationCalls[0].recipientType, 'store');
    assert.equal(notificationCalls[0].type, 'support.ticket.created');
  });

  it('creates low stock inbox item while processing inventory event', async () => {
    const repository = {
      async insertDelivery() {},
      async insertInboxNotification(input) {
        this.lastInbox = input;
        return {
          ...input,
          id: 'notif-1',
          recipient_label: null,
          status: 'unread',
          read_at: null,
          action_url: input.actionUrl ?? null,
          metadata: input.metadata ?? {},
          created_at: new Date(),
          updated_at: new Date(),
          store_id: input.storeId,
          recipient_type: input.recipientType,
          recipient_store_user_id: input.recipientStoreUserId,
          recipient_customer_id: input.recipientCustomerId,
          title: input.title,
          body: input.body,
          type: input.type,
        };
      },
      lastInbox: null,
    };

    const service = new NotificationsService(repository, {
      async dispatchBackInStockNotifications() {
        return { sentCount: 0, failedCount: 0 };
      },
    });

    await service.processEvent({
      eventType: 'inventory.low_stock',
      payload: {
        storeId: 'store-1',
        productTitle: 'T-Shirt',
      },
      attempts: 1,
    });

    assert.ok(repository.lastInbox);
    assert.equal(repository.lastInbox.type, 'inventory.low_stock');
    assert.equal(repository.lastInbox.recipientType, 'store');
  });
});
