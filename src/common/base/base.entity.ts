import { AutoMap } from '@automapper/classes';
import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @AutoMap()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @AutoMap()
  @Column({ nullable: true })
  createdBy?: string;

  @AutoMap()
  @CreateDateColumn({ nullable: true })
  createdAt?: Date;

  @AutoMap()
  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
