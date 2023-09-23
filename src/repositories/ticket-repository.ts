import { prisma } from '../config/database';

async function findTicketTypeById(ticketTypeId: number) {
  return await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
  });
}

async function findEnrollmentIdByUserId(userId: number) {
  return await prisma.enrollment.findUnique({
    where: { userId },
    select: { id: true },
  });
}

async function findTicketByEnrollmentId(enrollmentId: number) {
  return await prisma.ticket.findUnique({
    where: { enrollmentId },
    include: { TicketType: true },
  });
}

async function createTicket(enrollmentId: number, ticketTypeId: number) {
  return await prisma.ticket.create({
    data: {
      status: 'RESERVED',
      ticketTypeId,
      enrollmentId,
    },
  });
}

async function getTicketTypes() {
  return await prisma.ticketType.findMany();
}

export const ticketsRepository = {
  findTicketTypeById,
  findEnrollmentIdByUserId,
  findTicketByEnrollmentId,
  createTicket,
  getTicketTypes,
};
