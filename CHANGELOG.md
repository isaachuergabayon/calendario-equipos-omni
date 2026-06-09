# Changelog

# [0.5.0](https://github.com/isaachuergabayon/calendario-equipos-omni/compare/v0.4.0...v0.5.0) (2026-06-09)


### Features

* **calendar:** filter absences by person via sidebar click ([e1cb7b2](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/e1cb7b2b23cf0260a519ed785926334459e6994d))
* **ical:** export team absences to .ics calendar file ([b5be78a](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/b5be78a36f818ab1dca2905d81a6d045ed528e4e))
* **modal:** always show working days badge when date range is selected ([d838b4b](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/d838b4b9da9eeff4052715f950058447b9448556))

# [0.4.0](https://github.com/isaachuergabayon/calendario-equipos-omni/compare/v0.3.0...v0.4.0) (2026-06-09)


### Features

* **locations:** add computed holidays for Gijón, Oviedo, Badajoz; fix Murcia Bando de la Huerta ([f366f79](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/f366f79d29b5bdf1ae7724f0d540de0ba6fbb56b))


### Performance Improvements

* **app:** lazy-load all page routes via React.lazy + Suspense ([9622a8d](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/9622a8d480e82b4d6519326eb841a95564c0ad11))

# [0.3.0](https://github.com/isaachuergabayon/calendario-equipos-omni/compare/v0.2.0...v0.3.0) (2026-06-09)


### Bug Fixes

* use GITHUB_TOKEN instead of GH_TOKEN for release-it GitHub Releases ([408ba67](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/408ba677eb1e7b8562d0812db36138ca2d46c225))


### Features

* ErrorBoundary, TeamFilter upgrades, useAbsences cutoff, firestore fixes ([b555c96](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/b555c96664e726aaaef8410854154a4c4702fcea))
* type filter bar, event tooltips, and unit tests ([f5487e8](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/f5487e840f73bd8f614bd245873e4ca9d211478d))

# [0.2.0](https://github.com/isaachuergabayon/calendario-equipos-omni/compare/v0.1.0...v0.2.0) (2026-06-09)


### Bug Fixes

* unable to clear absence notes on edit, add missing local holidays for Sevilla, Cáceres and Oviedo, extract countWorkingDays to shared util ([8f8e4b8](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/8f8e4b8db885f35835f5f8687012e797b7d68b0f))


### Features

* add day view to calendar, today absent section, fiscal year navigation and per-user absence detail in sidebar; remove scaffold dead code ([36d12e0](https://github.com/isaachuergabayon/calendario-equipos-omni/commit/36d12e07f27819718e6b27e71a4fbee786e11b77))
