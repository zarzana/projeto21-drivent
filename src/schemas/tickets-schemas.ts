import Joi from 'joi';
import { TicketTypeId } from '@/services';

export const createUserTicketSchema = Joi.object<TicketTypeId>({
  ticketTypeId: Joi.number().required(),
});
