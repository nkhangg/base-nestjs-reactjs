import { BaseEntity } from '../../../../shared/domain/base-entity';
import { ConfigId } from '../value-objects/config-id.vo';
import { ConfigKey } from '../value-objects/config-key.vo';

export type ConfigScope = 'public' | 'members' | 'internal';

export interface AppConfigProps {
  key: ConfigKey;
  value: unknown;
  description: string | null;
  isEnabled: boolean;
  scope: ConfigScope;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AppConfig extends BaseEntity<ConfigId> {
  private props: AppConfigProps;

  private constructor(id: ConfigId, props: AppConfigProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    key: string;
    value: unknown;
    description?: string;
    scope?: ConfigScope;
    tags?: string[];
    createdBy?: string;
  }): AppConfig {
    const now = new Date();
    return new AppConfig(ConfigId.create(), {
      key: ConfigKey.create(params.key),
      value: params.value,
      description: params.description ?? null,
      isEnabled: true,
      scope: params.scope ?? 'public',
      tags: params.tags ?? [],
      createdBy: params.createdBy ?? null,
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: AppConfigProps): AppConfig {
    return new AppConfig(ConfigId.from(id), props);
  }

  update(params: {
    value?: unknown;
    description?: string | null;
    scope?: ConfigScope;
    tags?: string[];
    updatedBy?: string;
  }): void {
    if (params.value !== undefined) this.props.value = params.value;
    if (params.description !== undefined) this.props.description = params.description;
    if (params.scope !== undefined) this.props.scope = params.scope;
    if (params.tags !== undefined) this.props.tags = params.tags;
    this.props.updatedBy = params.updatedBy ?? null;
    this.props.updatedAt = new Date();
  }

  toggle(): void {
    this.props.isEnabled = !this.props.isEnabled;
    this.props.updatedAt = new Date();
  }

  get key(): ConfigKey { return this.props.key; }
  get value(): unknown { return this.props.value; }
  get description(): string | null { return this.props.description; }
  get isEnabled(): boolean { return this.props.isEnabled; }
  get scope(): ConfigScope { return this.props.scope; }
  get tags(): string[] { return this.props.tags; }
  get createdBy(): string | null { return this.props.createdBy; }
  get updatedBy(): string | null { return this.props.updatedBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
