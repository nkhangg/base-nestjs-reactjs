import { Global, Module } from '@nestjs/common';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { MAILER_SERVICE } from './mail.interface';
import { NodemailerMailerService } from './mail.service';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './processors/mail.processor';

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST ?? 'localhost',
        port: parseInt(process.env.MAIL_PORT ?? '1025', 10),
        auth: process.env.MAIL_USER
          ? {
              user: process.env.MAIL_USER,
              pass: process.env.MAIL_PASS ?? '',
            }
          : undefined,
      },
      defaults: {
        from: process.env.MAIL_FROM ?? 'No Reply <noreply@example.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
    BullModule.registerQueue({ name: QUEUE_NAMES.MAIL }),
  ],
  providers: [
    NodemailerMailerService,
    MailQueueService,
    MailProcessor,
    { provide: MAILER_SERVICE, useExisting: MailQueueService },
  ],
  exports: [MAILER_SERVICE],
})
export class MailModule {}
