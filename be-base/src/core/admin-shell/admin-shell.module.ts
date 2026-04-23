import { DynamicModule, Module } from '@nestjs/common';
import { AdminRouteRegistry } from './admin-route.registry';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({})
export class AdminShellModule {
  static forRoot(): DynamicModule {
    return {
      module: AdminShellModule,
      global: true,
      providers: [AdminRouteRegistry, AdminAuthGuard],
      exports: [AdminRouteRegistry, AdminAuthGuard],
    };
  }
}
