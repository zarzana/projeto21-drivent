import { Ticket, TicketType } from '@prisma/client';
import { conflictError, enrollmentNotFoundError, notFoundError, ticketTypeNotFoundError } from '@/errors';
import { ticketsRepository } from '@/repositories';

export type TicketTypeId = Pick<Ticket, 'ticketTypeId'>;
export type TicketTypeIdWithUserId = TicketTypeId & { userId: number };
export type TicketWithType = Ticket & { TicketType: TicketType };

async function createUserTicket(params: TicketTypeIdWithUserId) {
  const ticketType = await ticketsRepository.findTicketTypeById(params.ticketTypeId);
  if (!ticketType) throw ticketTypeNotFoundError();

  const enrollment = await ticketsRepository.findEnrollmentIdByUserId(params.userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (ticket) throw conflictError('A ticket for this enrollment already exists.');

  const { id, ticketTypeId, enrollmentId, status, createdAt, updatedAt } = await ticketsRepository.createTicket(
    enrollment.id,
    ticketType.id,
  );

  return <TicketWithType>{ id, status, ticketTypeId, enrollmentId, TicketType: ticketType, createdAt, updatedAt };
}

async function getUserTickets(userId: number) {
  const enrollment = await ticketsRepository.findEnrollmentIdByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();

  const { id, ticketTypeId, enrollmentId, status, createdAt, updatedAt, TicketType } = ticket;

  return <TicketWithType>{ id, status, ticketTypeId, enrollmentId, TicketType, createdAt, updatedAt };
}

async function getTicketTypes() {
  return await ticketsRepository.getTicketTypes();
}

export const ticketsService = {
  createUserTicket,
  getUserTickets,
  getTicketTypes,
};
