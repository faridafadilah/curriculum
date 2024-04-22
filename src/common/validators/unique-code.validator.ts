import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { EntityManager } from 'typeorm';

import { InjectEntityManager } from '@nestjs/typeorm';
import { IsUniqueInterface } from '../decorators/unique-code.decorator';

@ValidatorConstraint({ name: 'IsUniqueConstraint', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

  async validate(value: any, args?: ValidationArguments): Promise<boolean> {
    const { tableName, column }: IsUniqueInterface = args.constraints[0];
    const dataExist = await this.entityManager
      .getRepository(tableName)
      .createQueryBuilder(tableName)
      .where({ [column]: value })
      .getExists();

    return !dataExist;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    const field: string = validationArguments.property;

    return `${field} is already exist`;
  }
}
