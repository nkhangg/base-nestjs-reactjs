import { BaseEntity } from '../../../../shared/domain/base-entity';
import { MediaFolderId } from '../value-objects/media-folder-id.vo';

export interface MediaFolderProps {
  name: string;
  parentId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MediaFolder extends BaseEntity<MediaFolderId> {
  private props: MediaFolderProps;

  private constructor(id: MediaFolderId, props: MediaFolderProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    name: string;
    parentId?: string;
    createdBy?: string;
  }): MediaFolder {
    const now = new Date();
    return new MediaFolder(MediaFolderId.create(), {
      name: params.name,
      parentId: params.parentId ?? null,
      createdBy: params.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: MediaFolderProps): MediaFolder {
    return new MediaFolder(MediaFolderId.from(id), props);
  }

  rename(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  move(parentId: string | null): void {
    this.props.parentId = parentId;
    this.props.updatedAt = new Date();
  }

  get name(): string {
    return this.props.name;
  }
  get parentId(): string | null {
    return this.props.parentId;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
