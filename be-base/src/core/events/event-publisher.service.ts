import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DomainEvent } from '../../shared/domain/domain-event';
import type { IDomainEventBus } from './domain/domain-event-bus.interface';

@Injectable()
export class EventPublisher implements IDomainEventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.emitter.emit(event.eventName, event);
  }

  publishAll(events: DomainEvent[]): void {
    events.forEach((e) => this.publish(e));
  }
}
