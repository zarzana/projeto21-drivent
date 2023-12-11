import { ApplicationError } from '@/protocols';

export function paymentRequiredError(message = 'Payment information is required!'): ApplicationError {
  return {
    name: 'PaymentRequired',
    message,
  };
}
