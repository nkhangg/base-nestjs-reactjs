import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { BaseAggregate } from '../../shared/domain/base-aggregate';

@Injectable()
export class EventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  publishAll(aggregate: BaseAggregate<unknown>): void {
    const events = aggregate.domainEvents;
    aggregate.clearDomainEvents();
    for (const event of events) {
      this.emitter.emit(event.eventName, event);
    }
  }
}
