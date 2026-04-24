import { AppConfig, type ConfigScope } from '../../domain/entities/app-config.entity';
import { ConfigKey } from '../../domain/value-objects/config-key.vo';

interface AppConfigRecord {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  isEnabled: boolean;
  scope: string;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ConfigMapper {
  static toDomain(r: AppConfigRecord): AppConfig {
    return AppConfig.reconstitute(r.id, {
      key: ConfigKey.from(r.key),
      value: r.value,
      description: r.description,
      isEnabled: r.isEnabled,
      scope: r.scope as ConfigScope,
      tags: r.tags,
      createdBy: r.createdBy,
      updatedBy: r.updatedBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }
}
