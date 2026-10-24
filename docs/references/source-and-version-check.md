# Source and Version Check (24 October 2026)

This file records why the bootstrap template avoids blindly following `latest` tags.

- Node.js release schedule: https://github.com/nodejs/Release — Node 24 is Active LTS in the current schedule; confirm the exact patch and deployment provider support when bootstrapping.
- Next.js release list: https://github.com/vercel/next.js/releases — v16.4.3 was listed as a stable release on 23 Oct 2026; later canary releases exist and are not used by default.
- Expo SDK matrix: https://docs.expo.dev/versions/latest/ — SDK 57 maps to React Native 0.86 and React 19.2.3 in the published table; use Expo's install/fix tooling to keep native dependencies aligned.
- NestJS releases: https://github.com/nestjs/nest/releases — v12.0.3 is listed on the release page; confirm exact stable status during install.
- Prisma release status: https://www.prisma.io/docs/orm/release-status — Prisma 8 was a release candidate at the time checked; template uses Prisma 7 GA and its driver-adapter/config model.

Links:
- https://nextjs.org/docs/app
- https://docs.expo.dev/
- https://docs.nestjs.com/
- https://www.prisma.io/docs/orm/v7
- https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- https://asvs.owasp.org/

The release state can change. Re-check package compatibility and migration guides before updating the package manifests. A direct version pin is not a substitute for a lockfile and CI.
