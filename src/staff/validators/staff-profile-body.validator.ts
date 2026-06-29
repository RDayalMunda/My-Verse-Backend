import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { validateStaffProfileBody } from '../staff-profile.validation';

@ValidatorConstraint({ name: 'StaffProfileBody', async: false })
export class StaffProfileBodyConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    return validateStaffProfileBody(args.object as Record<string, unknown>).length === 0;
  }

  defaultMessage(args: ValidationArguments): string {
    const errors = validateStaffProfileBody(args.object as Record<string, unknown>);
    return errors[0] ?? 'Invalid staff profile body fields';
  }
}
