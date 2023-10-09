import { Router } from 'express';
import { getBooking } from '@/controllers';
import { authenticateToken, validateBody } from '@/middlewares';

const bookingRouter = Router();

bookingRouter
  .all('/*', authenticateToken) // all booking routes need to be authenticated
  .get('/', getBooking);
//   .post('/', validateBody(bookingSchema), postBooking)
//   .put('/:bookingId', validateBody(bookingRoomSchema), putBookingRoom);

export { bookingRouter };
