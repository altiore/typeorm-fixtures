import { isMatch, intersectionWith } from 'lodash';
import { ObjectType } from 'typeorm';

/**
 * @deprecated use many and one instead
 */
export function relation<EntityType>(
  allRelations: object,
  relationType: ObjectType<EntityType>,
  relation,
): EntityType[] {
  return (allRelations[relationType.name] && relation
    ? intersectionWith(allRelations[relationType.name], relation, isMatch)
    : allRelations[relationType.name] || []) as EntityType[];
}

export function many<EntityType>(allRelations: object, relationType: ObjectType<EntityType>, relation): EntityType[] {
  return (allRelations[relationType.name] && relation
    ? intersectionWith(allRelations[relationType.name], relation, isMatch)
    : allRelations[relationType.name] || []) as EntityType[];
}

export function one<EntityType>(allRelations: object, relationType: ObjectType<EntityType>, relation): EntityType {
  if (!allRelations[relationType.name]) {
    throw new Error(
      `Data for relation "${JSON.stringify(relation)}" is not set. Please load the fixture for it first!`,
    );
  }
  if (!relation) {
    throw new Error(`Relation data is required!`);
  }
  return allRelations[relationType.name].find((el: ObjectType<EntityType>) => isMatch(el, relation));
}
