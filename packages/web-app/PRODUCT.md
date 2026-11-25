# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Grottocenter serves people consulting and contributing to an international,
collaborative database of caves and entrances. The map-export workflow serves
people preparing a caving trip with an outdoor GPS application.

## Product Purpose

Make collaborative speleological information accessible through a multilingual
web application, including an interactive map and individual entrance records.

## Operating Context

Trip preparation includes taking a selection of entrances into an external GPS
application for use in the field. The user has confirmed a public export,
available without signing in, covering all public entrances in the displayed map
bounds. The user simplified the scope on 25 November 2026: size, data quality and
interest filters are ignored, with an explicit notice before downloading.

## Capabilities and Constraints

- An entrance is the physical opening; a cave is the volume behind it. A network
  is a cave linked to at least two entrances. Preserve this vocabulary.
- The requested map export provides GPX, KML and GeoJSON with entrance names,
  coordinates and links to their Grottocenter records.
- Sensitive entrances are excluded from public geographic exports.
- Existing API export limits must be reflected
  explicitly in the user experience.

## Evidence on Hand

- Repository guidance: `../../AGENTS.md` and `AGENTS.md`.
- Map-export request: frontend issue #1458.
- Product scope and export-window interaction confirmed by the user on
  24 November 2026.
- Existing map: `src/components/common/Maps/MapClusters/index.jsx`.
- Existing geographic export: `src/actions/Advancedsearch.js`.
