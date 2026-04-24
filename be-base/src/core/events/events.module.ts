import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventPublisher } from './event-publisher.service';

@Global()
@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: false, delimiter: '.' })],
  providers: [EventPublisher],
  exports: [EventPublisher],
})
export class EventsModule {}
