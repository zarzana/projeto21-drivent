import { prisma } from '@/config';

async function findBookingByUserId(userId: number) {
  return prisma.booking.findUnique({
    where: { userId: userId },
    select: { id: true, Room: true },
  });
}

async function findRoomById(roomId: number) {
  return await prisma.room.findUnique({
    where: { id: roomId },
    select: { capacity: true, _count: { select: { Booking: true } } },
  });
}

async function postBooking(userId: number, roomId: number) {
  return await prisma.booking.create({
    data: { userId, roomId },
    select: { id: true },
  });
}

async function putBooking(bookingId: number, roomId: number) {
  return await prisma.booking.update({
    where: { id: bookingId },
    data: { roomId },
    select: { id: true },
  });
}

export const bookingRepository = {
  findBookingByUserId,
  findRoomById,
  postBooking,
  putBooking,
};
