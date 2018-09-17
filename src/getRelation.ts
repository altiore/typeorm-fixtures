import { intersectionWith, isMatch } from 'lodash';

export function getRelation<EntityType>(
  this: EntityType | EntityType[],
  fixtureName: string,
  entity,
  relationName: string,
): EntityType | EntityType[] {
  return (this[fixtureName] && entity[relationName]
    ? intersectionWith(this[fixtureName], entity[relationName], isMatch)
    : this[fixtureName] || []) as EntityType[];
}
