# Access Controllers

Access controllers define the write access a user has to a database. By default, write access is limited to the user who created the database. Access controllers provide a way in which write access can be expanded to users other than the database creator.

An access controller is passed when a database is opened for the first time. Once created, the database's write access will be limited to only those users who are listed. By default, only the user creating the database will have write access.

Different access controllers can be assigned to the database using the `AccessController` param and passing it to OrbitDB's `open` function.

```
const orbitdb = await OrbitDB()
const db = orbitdb.open('my-db', { AccessController: SomeAccessController() })
```

OrbitDB is bundled with two AccessControllers; IPFSAccessController, an immutable access controller which uses IPFS to store the access settings, and OrbitDBAccessController, a mutable access controller which uses OrbitDB's keyvalue database to store one or more permissions.

## IPFS Access Controller

By default, the database `db` will use the IPFSAccessController and allow only the creator to write to the database.

```
const orbitdb = await OrbitDB()
const db = orbitdb.open('my-db')
```

To change write access, pass the IPFSAccessController with the `write ` parameter and an array of one or more Identity ids:

```
const identities = await Identities()
const identity1 = identities.createIdentity('userA')
const identity2 = identities.createIdentity('userB')

const orbitdb = await OrbitDB()
const db = orbitdb.open('my-db', { AccessController: IPFSAccessController(write: [identity1.id, identity2.id]) })
```

To allow anyone to write to the database, specify the wildcard '*':

```
const orbitdb = await OrbitDB()
const db = orbitdb.open('my-db', { AccessController: IPFSAccessController(write: ['*']) })
```

## OrbitDB Access Controller

The OrbitDB access controller provides configurable write access using grant and revoke.

```
const identities = await Identities()
const identity1 = identities.createIdentity('userA')
const identity2 = identities.createIdentity('userB')

const orbitdb = await OrbitDB()
const db = orbitdb.open('my-db', { AccessController: OrbitDBAccessController(write: [identity1.id]) })

db.access.grant('write', identity2.id)
db.access.revoke('write', identity2.id)
```

When granting or revoking access, a capability and the identity's id must be defined.

Grant and revoke are not limited to 'write' access only. A custom access capability can be specified, for example, `db.access.grant('custom-access', identity1.id)`.

## Custom Access Controller

Access can be customized by implementing a custom access controller. To implement a custom access controller, specify:

- A curried function with the function signature `async ({ orbitdb, identities, address })`,
- A `type` constant,
- A canAppend function with the param `entry`.

```
const type = 'custom'

const CustomAccessController = () => async ({ orbitdb, identities, address }) => {
  address = '/custom/access-controller'

  const canAppend = (entry) => {

  }
}

CustomAccessController.type = type
```

Additional configuration can be passed to the access controller by adding one or more parameters to the `CustomAccessController` function. For example, passing a configurable object parameter with the variable `write`:

```
const CustomAccessController = ({ write }) => async ({ orbitdb, identities, address }) => {
}
```

### The canAppend function

The main driver of the access controller is the canAppend function. This specifies whether an identity can or cannot add an item to the operations log (or any other mechanism requiring access authorization).

How the custom access controller evaluates access will be determined by its use case, but in most instances, the canAppend function will want to check whether the entry being created can be written to the database (and underlying operations log). Therefore, the entry's identity will need to be used to retrieve the identity's id:

```
write = [identity.id]

const canAppend = async (entry) => {
  const writerIdentity = await identities.getIdentity(entry.identity)
  if (!writerIdentity) {
    return false
  }

  const { id } = writerIdentity

  if (write.includes(id) || write.includes('*')) {
    return identities.verifyIdentity(writerIdentity)
  }
  return false
}
```

In the above example, the `entry.identity` will be the hash of the identity. Using this hash, the entire identity can be retrieved and the identity's id is used to verify write access. `write.includes('*')` is wildcard write and would allow any identity to write to the operations log.

### Using a custom access controller with OrbitDB

Before passing the custom access controller to the `open` function, it must be added to OrbitDB's AccessControllers:

```
AccessControllers.add(CustomAccessController)
const orbitdb = await OrbitDB()
const db = await orbitdb.open('my-db', { AccessController: CustomAccessController(params) })
```