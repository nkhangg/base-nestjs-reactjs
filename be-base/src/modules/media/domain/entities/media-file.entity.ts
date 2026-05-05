import { BaseEntity } from '../../../../shared/domain/base-entity';
import { MediaFileId } from '../value-objects/media-file-id.vo';

export type MediaScope = 'public' | 'private';

export interface MediaFileProps {
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  thumbnailKey: string | null;
  thumbnailUrl: string | null;
  alt: string | null;
  scope: MediaScope;
  folderId: string | null;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MediaFile extends BaseEntity<MediaFileId> {
  private props: MediaFileProps;

  private constructor(id: MediaFileId, props: MediaFileProps) {
    super(id);
    this.props = props;
  }

  static create(params: {
    key: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
    width?: number;
    height?: number;
    thumbnailKey?: string;
    thumbnailUrl?: string;
    alt?: string;
    scope?: MediaScope;
    folderId?: string;
    tags?: string[];
    createdBy?: string;
  }): MediaFile {
    const now = new Date();
    return new MediaFile(MediaFileId.create(), {
      key: params.key,
      filename: params.filename,
      mimeType: params.mimeType,
      size: params.size,
      url: params.url,
      width: params.width ?? null,
      height: params.height ?? null,
      thumbnailKey: params.thumbnailKey ?? null,
      thumbnailUrl: params.thumbnailUrl ?? null,
      alt: params.alt ?? null,
      scope: params.scope ?? 'public',
      folderId: params.folderId ?? null,
      tags: params.tags ?? [],
      createdBy: params.createdBy ?? null,
      updatedBy: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(id: string, props: MediaFileProps): MediaFile {
    return new MediaFile(MediaFileId.from(id), props);
  }

  updateMeta(params: {
    filename?: string;
    alt?: string | null;
    tags?: string[];
    scope?: MediaScope;
    folderId?: string | null;
    updatedBy?: string;
  }): void {
    if (params.filename !== undefined) this.props.filename = params.filename;
    if (params.alt !== undefined) this.props.alt = params.alt;
    if (params.tags !== undefined) this.props.tags = params.tags;
    if (params.scope !== undefined) this.props.scope = params.scope;
    if (params.folderId !== undefined) this.props.folderId = params.folderId;
    this.props.updatedBy = params.updatedBy ?? null;
    this.props.updatedAt = new Date();
  }

  get key(): string {
    return this.props.key;
  }
  get filename(): string {
    return this.props.filename;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get size(): number {
    return this.props.size;
  }
  get width(): number | null {
    return this.props.width;
  }
  get height(): number | null {
    return this.props.height;
  }
  get url(): string {
    return this.props.url;
  }
  get thumbnailKey(): string | null {
    return this.props.thumbnailKey;
  }
  get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }
  get alt(): string | null {
    return this.props.alt;
  }
  get scope(): MediaScope {
    return this.props.scope;
  }
  get folderId(): string | null {
    return this.props.folderId;
  }
  get tags(): string[] {
    return this.props.tags;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }
  get updatedBy(): string | null {
    return this.props.updatedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
