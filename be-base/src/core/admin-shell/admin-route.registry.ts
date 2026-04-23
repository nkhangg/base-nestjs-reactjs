import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { AdminFeature, ADMIN_FEATURE } from './admin.interface';

@Injectable()
export class AdminRouteRegistry {
  private readonly logger = new Logger(AdminRouteRegistry.name);

  constructor(
    @Optional()
    @Inject(ADMIN_FEATURE)
    private readonly features: AdminFeature[] = [],
  ) {}

  getFeatures(): AdminFeature[] {
    return this.features ?? [];
  }

  getControllers() {
    return this.getFeatures().map((f) => f.controller);
  }

  getMenuItems() {
    return this.getFeatures()
      .filter((f) => f.menu)
      .map((f) => ({ resource: f.resource, ...f.menu }))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }

  logRegistered(): void {
    const resources = this.getFeatures().map((f) => f.resource);
    this.logger.log(`Admin features registered: [${resources.join(', ')}]`);
  }
}
