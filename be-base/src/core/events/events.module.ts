import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventPublisher } from './event-publisher.service';
import { DOMAIN_EVENT_BUS } from './domain/domain-event-bus.interface';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })],
  providers: [
    EventPublisher,
    { provide: DOMAIN_EVENT_BUS, useExisting: EventPublisher },
  ],
  exports: [DOMAIN_EVENT_BUS],
})
export class EventsModule {}
