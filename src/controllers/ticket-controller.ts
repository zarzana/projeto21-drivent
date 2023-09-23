import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import { ticketsService } from '@/services';

export async function postUserTicket(req: AuthenticatedRequest, res: Response) {
  const userTicketWithType = await ticketsService.createUserTicket({
    ...req.body,
    userId: req.userId,
  });

  return res.status(httpStatus.CREATED).send(userTicketWithType);
}

export async function getUserTicket(req: AuthenticatedRequest, res: Response) {
  const ticket = await ticketsService.getUserTickets(req.userId);

  res.status(httpStatus.OK).send(ticket);
}

export async function getTicketTypes(_req: AuthenticatedRequest, res: Response) {
  const result = await ticketsService.getTicketTypes();

  res.status(httpStatus.OK).send(result);
}
