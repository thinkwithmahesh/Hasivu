export type DomainEvent =
  | {
      type: 'wallet.ledger.posted.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        walletAccountId: string;
        entryId: string;
        direction: 'credit' | 'debit';
        amount: string;
      };
    }
  | {
      type: 'subscription.renewal.failed.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        subscriptionId: string;
        billingCycleId: string;
        attempt: number;
        nextAttemptAt?: string;
      };
    }
  | {
      type: 'order.created.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        orderId: string;
        userId: string;
        amount: string;
      };
    }
  | {
      type: 'order.status.changed.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        orderId: string;
        previousStatus: string;
        newStatus: string;
      };
    }
  | {
      type: 'payment.captured.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        paymentId: string;
        orderId: string;
        amount: string;
      };
    }
  | {
      type: 'meal_schedule.published.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        scheduleId: string;
        from: string;
        to: string;
        notifyParents: boolean;
      };
    }
  | {
      type: 'whatsapp.message.failed.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        messageId: string;
        reason: string;
        fallbackChannel: 'email' | 'in_app' | 'sms';
      };
    }
  | {
      type: 'recommendation.feedback.recorded.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        runId: string;
        itemId: string;
        action: string;
      };
    };
