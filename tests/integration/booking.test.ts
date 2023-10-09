import * as jwt from 'jsonwebtoken';
import supertest from 'supertest';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import { cleanDb, generateValidToken } from '../helpers';
import { createEnrollmentWithAddress, createTicket, createTicketType, createUser } from '../factories';
import { createBooking, createRoom } from '../factories/booking-factory';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});
beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if an invalid token is given', async () => {
    const token = faker.lorem.word();
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 if there is no booking for given user', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const { status } = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 200 and booking data when user has correct booking, room, and ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom();
      const booking = await createBooking(user.id, room.id);
      const { status, body } = await server.get('/booking').set('Authorization', `Bearer ${token}`);
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({
        id: body.id,
        Room: {
          ...booking.Room,
          createdAt: booking.Room.createdAt.toISOString(),
          updatedAt: booking.Room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe('POST /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.post('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 if given room does not exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const { status } = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: 999999 });
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 403 if the given room is full', async () => {
      const user = await createUser();
      await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom(1); // setting room capacity to 1 so that bookingUser cannot join room
      await createBooking(user.id, room.id);

      const bookingUser = await createUser();
      const bookingUserToken = await generateValidToken(bookingUser);
      const bookingUserEnrollment = await createEnrollmentWithAddress(bookingUser);
      await createTicket(bookingUserEnrollment.id, ticketType.id, 'PAID');

      const { status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${bookingUserToken}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 if user already has an associated booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom();
      await createBooking(user.id, room.id);
      const { status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 if user has no associated enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const room = await createRoom();
      const { status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 if user has no associated ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);
      const room = await createRoom();
      const { status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 if associated ticket has yet to be paid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'RESERVED');
      const room = await createRoom();
      const { status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 if associated ticket does not include a hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, false);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom();
      const { status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 if associated ticket is remote', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(true, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom();
      const { status } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 200 and booking data when attempted booking is fully valid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom();
      const { status, body } = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({
        bookingId: body.bookingId,
      });
    });
  });
});

describe('PUT /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.put('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const response = await server.put('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.put('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 if given room does not exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom();
      const booking = await createBooking(user.id, room.id);
      const { status } = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id + 1 });
      expect(status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 403 if the given room is full', async () => {
      const user = await createUser();
      await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom(1);
      await createBooking(user.id, room.id);

      const bookingUser = await createUser();
      const bookingUserToken = await generateValidToken(bookingUser);
      const bookingUserEnrollment = await createEnrollmentWithAddress(bookingUser);
      await createTicket(bookingUserEnrollment.id, ticketType.id, 'PAID');
      const booking2 = await createBooking(bookingUser.id, room.id);

      const { status } = await server
        .put(`/booking/${booking2.id}`)
        .set('Authorization', `Bearer ${bookingUserToken}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 if the user has no associated booking', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const room = await createRoom();
      const { status } = await server
        .put(`/booking/${99999}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room.id });
      expect(status).toBe(httpStatus.FORBIDDEN);
    });

    it('should respond with status 200 and booking data when attempted booking alteration is fully valid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enrollment.id, ticketType.id, 'PAID');
      const room = await createRoom();
      const room2 = await createRoom();
      const booking = await createBooking(user.id, room.id);
      const { status, body } = await server
        .put(`/booking/${booking.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ roomId: room2.id });
      expect(status).toBe(httpStatus.OK);
      expect(body).toEqual({
        bookingId: body.bookingId,
      });
    });
  });
});
