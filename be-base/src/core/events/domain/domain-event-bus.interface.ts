import type { DomainEvent } from '../../../shared/domain/domain-event';

export const DOMAIN_EVENT_BUS = Symbol('DOMAIN_EVENT_BUS');

export interface IDomainEventBus {
  publish(event: DomainEvent): void;
  publishAll(events: DomainEvent[]): void;
}
