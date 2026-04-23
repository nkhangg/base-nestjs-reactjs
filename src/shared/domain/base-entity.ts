export abstract class BaseEntity<T> {
  protected readonly _id: T;

  constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  equals(entity: BaseEntity<T>): boolean {
    if (!(entity instanceof BaseEntity)) return false;
    const a = this._id as { equals?: (other: unknown) => boolean } | string;
    if (typeof (a as { equals?: unknown }).equals === 'function') {
      return (a as { equals: (other: unknown) => boolean }).equals(entity._id);
    }
    return this._id === entity._id;
  }
}
