import { EventPublisher } from './event-publisher.service';
import type { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../../shared/domain/domain-event';

class TestEvent extends DomainEvent {
  readonly eventName = 'test.happened';
  constructor(public readonly payload: string) {
    super();
  }
}

const makeEmitter = (): jest.Mocked<Pick<EventEmitter2, 'emit'>> => ({
  emit: jest.fn(),
});

describe('EventPublisher', () => {
  let publisher: EventPublisher;
  let emitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;

  beforeEach(() => {
    emitter = makeEmitter();
    publisher = new EventPublisher(emitter as unknown as EventEmitter2);
  });

  describe('publish', () => {
    it('calls emitter.emit with eventName and event object', () => {
      const event = new TestEvent('hello');

      publisher.publish(event);

      expect(emitter.emit).toHaveBeenCalledTimes(1);
      expect(emitter.emit).toHaveBeenCalledWith('test.happened', event);
    });

    it('sets occurredAt on the emitted event', () => {
      const before = new Date();
      const event = new TestEvent('ts-check');
      publisher.publish(event);
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('publishAll', () => {
    it('calls emitter.emit once per event in order', () => {
      const e1 = new TestEvent('first');
      const e2 = new TestEvent('second');
      const e3 = new TestEvent('third');

      publisher.publishAll([e1, e2, e3]);

      expect(emitter.emit).toHaveBeenCalledTimes(3);
      expect(emitter.emit).toHaveBeenNthCalledWith(1, 'test.happened', e1);
      expect(emitter.emit).toHaveBeenNthCalledWith(2, 'test.happened', e2);
      expect(emitter.emit).toHaveBeenNthCalledWith(3, 'test.happened', e3);
    });

    it('does nothing for an empty array', () => {
      publisher.publishAll([]);
      expect(emitter.emit).not.toHaveBeenCalled();
    });
  });
});
