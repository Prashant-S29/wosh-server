import { User, Session } from 'better-auth/*';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: {
    user: User;
    session: Session;
  };
}
