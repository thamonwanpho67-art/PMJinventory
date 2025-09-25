# Prisma Migration Note

## Current Status
This project is currently using Prisma 6.x which still requires configuration in `package.json`.

The warning "The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7" is expected and will be addressed when upgrading to Prisma 7.

## Migration Plan for Prisma 7
When upgrading to Prisma 7, move the configuration from `package.json` to `prisma.config.ts`:

### 1. Create `prisma.config.ts`:
```typescript
const config = {
  seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts'
};

export default config;
```

### 2. Remove from `package.json`:
```json
// Remove this section:
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

## Current Configuration Location
The seed command is currently configured in `package.json` under the `"prisma"` property.