import { ticketsService } from './tickets-service';
import { forbiddenError, notFoundError } from '@/errors';
import { bookingRepository, enrollmentRepository } from '@/repositories';

async function getBookingByUserId(userId: number) {
  const booking = await bookingRepository.findBookingByUserId(userId);
  if (!booking) throw notFoundError();
  return booking;
}

async function postBooking(userId: number, roomId: number) {
  // error 404 if room doesn't exist
  const room = await bookingRepository.findRoomById(roomId);
  if (!room) throw notFoundError();

  // error 403 if room is full
  if (room.capacity === room._count.Booking) throw forbiddenError();

  // error 403 if user already has booking
  const booking = await bookingRepository.findBookingByUserId(userId);
  if (booking) throw forbiddenError();

  // error 403 if usre has no enrollment
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw forbiddenError();

  // remaining errors 403 related to ticket status
  const ticket = await ticketsService.getTicketByUserId(userId);
  if (!ticket) throw forbiddenError();
  if (ticket.status !== 'PAID') throw forbiddenError();
  if (!ticket.TicketType.includesHotel) throw forbiddenError();
  if (ticket.TicketType.isRemote) throw forbiddenError();

  const { id } = await bookingRepository.postBooking(userId, roomId);
  return { bookingId: id };
}

export const bookingService = {
  getBookingByUserId,
  postBooking,
};
