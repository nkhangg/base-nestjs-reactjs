import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import type { IMailerService } from './mail.interface';

@Injectable()
export class NodemailerMailerService implements IMailerService {
  constructor(private readonly mailer: MailerService) {}

  async sendPasswordResetEmail({
    to,
    resetLink,
  }: {
    to: string;
    resetLink: string;
  }): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: 'Đặt lại mật khẩu',
      template: 'reset-password',
      context: { resetLink, expiresInHours: 1 },
    });
  }
}
