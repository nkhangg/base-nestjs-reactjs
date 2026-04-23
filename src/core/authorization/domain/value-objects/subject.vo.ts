import { ValueObject } from '../../../../shared/domain/value-object';

export type SubjectType = 'admin' | 'user' | 'merchant' | '*';

interface SubjectProps {
  id: string;
  type: SubjectType;
}

export class Subject extends ValueObject<SubjectProps> {
  private constructor(props: SubjectProps) {
    super(props);
  }

  static of(id: string, type: SubjectType): Subject {
    return new Subject({ id, type });
  }

  get id(): string {
    return this.props.id;
  }
  get type(): SubjectType {
    return this.props.type;
  }
}
