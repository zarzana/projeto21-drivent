import { ApplicationError } from '@/protocols';

export function ticketTypeNotFoundError(): ApplicationError {
  return {
    name: 'TicketTypeNotFoundError',
    message: 'Ticket type not found.',
  };
}
