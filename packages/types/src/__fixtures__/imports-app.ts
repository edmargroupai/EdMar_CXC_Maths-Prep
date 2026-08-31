/**
 * Boundary violation fixture (§2.2, P02 acceptance).
 * ESLint must reject packages → apps imports. Linted only by `pnpm test:boundaries`.
 */
import type Home from "../../../../apps/web/src/app/page.tsx";

export type BoundaryViolationFixture = typeof Home;
