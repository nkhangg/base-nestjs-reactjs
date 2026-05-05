export interface IMailerService {
  sendPasswordResetEmail(params: { to: string; resetLink: string }): Promise<void>;
}

export const MAILER_SERVICE = Symbol('MAILER_SERVICE');
