declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        sessionId: string;
        email: string;
        type: string; // 'user' | 'merchant' | 'admin'
        adminRole?: string; // only present when type === 'admin'
      };
    }
  }
}

export {};
