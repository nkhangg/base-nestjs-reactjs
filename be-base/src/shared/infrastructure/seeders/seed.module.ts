import { Module, OnModuleInit } from '@nestjs/common';
import { DummyDataSeeder } from './dummy-data.seeder';

@Module({
  providers: [DummyDataSeeder],
})
export class SeedModule implements OnModuleInit {
  constructor(private readonly seeder: DummyDataSeeder) {}

  async onModuleInit(): Promise<void> {
    await this.seeder.seed();
  }
}
