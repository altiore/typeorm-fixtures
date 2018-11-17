<div align="center">
  <a href="http://typeorm.io/">
    <img src="https://github.com/typeorm/typeorm/raw/master/resources/logo_big.png" width="246" height="114">
  </a>
  <br>
  <br>
  <a href="https://badge.fury.io/js/typeorm-fixtures">
    <img src="https://badge.fury.io/js/typeorm-fixtures.svg" alt="npm version" height="18">
  </a>
  <br>
  <br>
</div>

## Why we need it?

Quite often we have to load data into a database before running tests.
This library helps to solve this problem effortlessly.

## Usage example:

#### 1. Create fixture creators (only once per project)

```typescript
import { fixtureCreator, many, one } from "typeorm-fixtures";

import { Role } from "../.."; // this is typeorm Entity
import { Project } from "../.."; // this is typeorm Entity
import { User } from "../.."; // this is typeorm Entity

// NOTICE: not arrow function here!
export const createUsersFixture = fixtureCreator<User>(User, function(
  entity,
  index
) {
  return {
    email: `test${index}@mail.com`,
    status: 10,
    ...entity,
    roles: many(this, Role, entity.roles)
  };
});

// NOTICE: not arrow function here!
export const createProjectsFixture = fixtureCreator<Project>(Project, function(
  entity,
  index
) {
  return {
    title: `Default Title`,
    ...entity,
    owner: one(this, User, entity.owner)
  };
});
```

#### 2. Create fixtures (each time for certain test)

```typescript
export const usersFixture = createUsersFixture([
  {
    email: "user@mail.com",
    roles: [{ name: "user" }] // roles will automatically added here (look usage)
  },
  {
    email: "admin@mail.com",
    roles: [{ name: "user" }, { name: "admin" }]
  }
]);

export const projectsFixture = createProjectsFixture([
  {
    owner: { email: "admin@mail.com" } // owner will automatically linked with user above
  }
]);
```

#### 3. Download data before test and drop after

```typescript
import { TypeormFixtures } from "typeorm-fixtures";

const h = new TypeormFixtures()
  .findEntities({ name: In(["user", "admin"]) }, Role) // sequence is important here!
  .addFixture(usersFixture) // sequence is important here!
  .addFixture(projectsFixture); // sequence is important here!

describe(`GET /url`, async () => {
  let projectId: number;
  let user: User;

  beforeAll(async () => {
    await h.loadFixtures();
    projectId = h.entities.Project[0].id; // this is our project id, which was loaded
    user = h.entities.User.find(el => el.email === "user@mail.com"); // we also can find loaded user by email
  });

  afterAll(h.dropFixtures);

  it("test", async () => {
    // now all data loaded to database and you can perform any actions here
  });
});
```

## Install

```bash
npm i typeorm-fixtures --save-dev
```

```bash
yarn add typeorm-fixtures --dev
```

## Stay in touch

- Author - [Razzwan](https://t.me/Razzwan)

## Thanks for helping

- [Artem Batura](https://github.com/artemirq)
- [Volodymyr Steblii](https://github.com/vsteblii)

## License

Nest is [MIT licensed](LICENSE).

## [Contributing](CONTRIBUTING.md)
