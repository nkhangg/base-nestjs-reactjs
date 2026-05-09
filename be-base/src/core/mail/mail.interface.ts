export interface IMailerService {
  sendPasswordResetEmail(params: {
    to: string;
    resetLink: string;
  }): Promise<void>;

  sendContactNotificationEmail(params: {
    to: string;
    firstName: string;
    lastName: string;
    email: string;
    subject: string;
  }): Promise<void>;

  sendContactReplyEmail(params: {
    to: string;
    firstName: string;
    lastName: string;
    subject: string;
    replyMessage: string;
  }): Promise<void>;
}

export const MAILER_SERVICE = Symbol('MAILER_SERVICE');
