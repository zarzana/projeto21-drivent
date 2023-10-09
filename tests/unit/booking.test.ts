import { bookingRepository } from '@/repositories';
import { bookingService } from '@/services';

describe('GET /booking', () => {
  it('should return booking when user has one', async () => {
    const bookingData: { id: number; Room: object } = { id: 1, Room: {} };
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return bookingData;
    });
    const promise = bookingService.getBookingByUserId(1);
    expect(promise).resolves.toEqual(bookingData);
  });

  it('should throw an error when there is no booking associated with user', async () => {
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return null;
    });
    const promise = bookingService.getBookingByUserId(1);
    expect(promise).rejects.toEqual({
      name: 'NotFoundError',
      message: 'No result for this search!',
    });
  });
});

describe('POST /booking', () => {
  it('should throw an error when room does not exist', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return null;
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'NotFoundError',
      message: 'No result for this search!',
    });
  });

  it('should throw an error when room is full', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 1, _count: { Booking: 1 } };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should throw an error when there is already a booking associated with user', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return { Booking: {} };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should throw an error when there is no enrollment associated with user', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return { Booking: null, Enrollment: [] };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should throw an error when the user doesnt have a ticket', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return { Booking: null, Enrollment: [{ Ticket: null }] };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should throw an error when ticket has yet to be paid', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return { Booking: null, Enrollment: [{ Ticket: { status: 'RESERVED' } }] };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should throw an error when the ticket has no associated hotel', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return {
        Booking: null,
        Enrollment: [{ Ticket: { status: 'PAID', TicketType: { includesHotel: false, isRemote: false } } }],
      };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should throw an error when ticket is remote', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return {
        Booking: null,
        Enrollment: [{ Ticket: { status: 'PAID', TicketType: { includesHotel: true, isRemote: true } } }],
      };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should succefully return booking if all requirements are met', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return {
        Booking: null,
        Enrollment: [{ Ticket: { status: 'PAID', TicketType: { includesHotel: true, isRemote: false } } }],
      };
    });
    const id = 1;
    jest.spyOn(bookingRepository, 'postBooking').mockImplementationOnce((): any => {
      return { id };
    });
    const promise = bookingService.postBooking(1, 1);
    expect(promise).resolves.toEqual({ bookingId: id });
  });
});

describe('PUT /booking', () => {
  it('should throw an error when room does not exist', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return null;
    });
    const promise = bookingService.putBooking(1, 1, 1);
    expect(promise).rejects.toEqual({
      name: 'NotFoundError',
      message: 'No result for this search!',
    });
  });

  it('should throw an error when room is full', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 1, _count: { Booking: 1 } };
    });
    const promise = bookingService.putBooking(1, 1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should throw an error when user does not have associated booking', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return { Booking: null };
    });
    const promise = bookingService.putBooking(1, 1, 1);
    expect(promise).rejects.toEqual({
      name: 'ForbiddenError',
      message: 'Not allowed.',
    });
  });

  it('should return booking if all requirements are met', async () => {
    jest.spyOn(bookingRepository, 'findRoomById').mockImplementationOnce((): any => {
      return { capacity: 4, _count: { Booking: 1 } };
    });
    jest.spyOn(bookingRepository, 'findBookingByUserId').mockImplementationOnce((): any => {
      return { Booking: {} };
    });
    const id = 1;
    jest.spyOn(bookingRepository, 'putBooking').mockImplementationOnce((): any => {
      return { id };
    });
    const promise = bookingService.putBooking(1, 1, 1);
    expect(promise).resolves.toEqual({ bookingId: id });
  });
});
