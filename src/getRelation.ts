import { isMatch, intersectionWith } from 'lodash';

export function relation<EntityType>(
  this: EntityType | EntityType[],
  fixtureName: string,
  entity,
  relationName: string,
): EntityType | EntityType[] {
  return (this[fixtureName] && entity[relationName]
    ? intersectionWith(this[fixtureName], entity[relationName], isMatch)
    : this[fixtureName] || []) as EntityType[];
}
