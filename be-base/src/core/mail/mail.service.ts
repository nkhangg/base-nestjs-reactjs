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

  async sendContactNotificationEmail({
    to,
    firstName,
    lastName,
    email,
    subject,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
  }): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: `[Liên hệ mới] ${subject}`,
      html: `
        <h3>Có liên hệ mới từ website</h3>
        <p><strong>Họ tên:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Chủ đề:</strong> ${subject}</p>
        <hr />
        <p>Đăng nhập vào admin panel để xem nội dung đầy đủ.</p>
      `,
    });
  }

  async sendContactReplyEmail({
    to,
    firstName,
    lastName,
    subject,
    replyMessage,
  }: {
    to: string;
    firstName: string;
    lastName: string;
    subject: string;
    replyMessage: string;
  }): Promise<void> {
    await this.mailer.sendMail({
      to,
      subject: `Re: ${subject}`,
      html: `
        <p>Xin chào ${firstName} ${lastName},</p>
        <br />
        <p>${replyMessage}</p>
      `,
    });
  }
}
