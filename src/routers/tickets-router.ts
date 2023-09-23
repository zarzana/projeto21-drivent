import { Router } from 'express';
import { authenticateToken, validateBody } from '@/middlewares';
import { postUserTicket, getUserTicket, getTicketTypes } from '@/controllers';
import { createUserTicketSchema } from '@/schemas';

const ticketsRouter = Router();

ticketsRouter
  .all('/*', authenticateToken)
  .post('/', validateBody(createUserTicketSchema), postUserTicket)
  .get('/', getUserTicket)
  .get('/types', getTicketTypes);

export { ticketsRouter };
