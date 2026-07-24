/**
 * Architektur-Regeln (Hexagonal / Ports & Adapters), in CI erzwungen.
 * Abhängigkeiten zeigen immer nach innen Richtung Domain.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Keine zirkulären Abhängigkeiten.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-stays-pure',
      comment: 'Domain bleibt framework-frei (kein @nestjs).',
      severity: 'error',
      from: { path: 'src/Modules/[^/]+/[^/]+/Domain' },
      to: { path: 'node_modules/@nestjs' },
    },
    {
      name: 'domain-no-outer-layers',
      comment: 'Domain darf nicht auf Application/Infrastructure/UI zugreifen.',
      severity: 'error',
      from: { path: 'src/Modules/[^/]+/[^/]+/Domain' },
      to: { path: 'src/Modules/[^/]+/[^/]+/(Application|Infrastructure|UI)' },
    },
    {
      name: 'application-no-infra-ui',
      comment: 'Application darf nicht auf Infrastructure/UI zugreifen.',
      severity: 'error',
      from: { path: 'src/Modules/[^/]+/[^/]+/Application' },
      to: { path: 'src/Modules/[^/]+/[^/]+/(Infrastructure|UI)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    exclude: { path: '(\\.spec\\.ts$|/Tests/)' },
  },
};
