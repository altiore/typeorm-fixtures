import { isMatch, intersectionWith } from 'lodash';
import { ObjectType } from 'typeorm';

export function relation<EntityType>(
  allRelations: object,
  relationType: ObjectType<EntityType>,
  relation,
): EntityType[] {
  return (allRelations[relationType.name] && relation
    ? intersectionWith(allRelations[relationType.name], relation, isMatch)
    : allRelations[relationType.name] || []) as EntityType[];
}
