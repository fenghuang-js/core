# Fenghuang

**What fenghuang is:**
 - A platform for rapid backend application development
 - Implemented in NodeJS
 - Multi-tenant at it's core
 - Modern
 - Metadata driven
 - Built on the shoulders of giants
 - Purely FOSS (Beerware)
 - In early development

**What fenghuang isn't:**

 - A frontend framework (While there are plans to build a series of Polymer components that integrate with the framework)
 - Trying to re-invent the wheel
 - A solution to end world hunger on it's own (You have to add the secret sauce)

## Goals for the platform

 - Dependency injection (Via bottle?)
 - Generic ORM (Via Sequelize)/ODM (Via Mongoose ?) with multi-tenant, optimistic locking, soft delete, baked-in.
 - Generic multi-tenant access control
 - Generic REST API generator (Via Express and custom routing)
 - Socket.IO support for chats, ORM notifications, etc.
 - Strong etag/caching support
 - Redis for quick data access
 - Authorization via JWT
 - Authentication/Gateway projects?