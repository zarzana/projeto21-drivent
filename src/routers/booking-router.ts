import { Router } from 'express';
import { getBooking, postBooking, putBooking } from '@/controllers';
import { authenticateToken, validateBody } from '@/middlewares';
import { bookingSchema } from '@/schemas';

const bookingRouter = Router();

bookingRouter
  .all('/*', authenticateToken) // all booking routes need to be authenticated
  .get('/', getBooking)
  .post('/', validateBody(bookingSchema), postBooking)
  .put('/:bookingId', validateBody(bookingSchema), putBooking);

export { bookingRouter };
