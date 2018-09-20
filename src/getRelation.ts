import { isMatch, intersectionWith } from 'lodash';
import { ObjectType } from 'typeorm';

export function relation<EntityType>(relationType: ObjectType<EntityType>, relation): EntityType[] {
  return (this[relationType.name] && relation
    ? intersectionWith(this[relationType.name], relation, isMatch)
    : this[relationType.name] || []) as EntityType[];
}
