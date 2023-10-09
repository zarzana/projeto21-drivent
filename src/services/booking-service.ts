import { notFoundError } from '@/errors';
import { bookingRepository } from '@/repositories';

async function getBookingByUserId(userId: number) {
  const booking = await bookingRepository.findBookingByUserId(userId);
  if (!booking) throw notFoundError();
  return booking;
}

export const bookingService = {
  getBookingByUserId,
};
