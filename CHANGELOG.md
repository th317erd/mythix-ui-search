# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-02-08

### Changed

- **Breaking**: Updated to use `data-event-on{eventName}` event binding pattern
- Requires `mythix-ui-core` v2.0.0 or later

### Migration Guide

This version requires updating your `mythix-ui-core` dependency to v2.0.0.

Event attributes in templates changed from:
```html
<input oninput="handleSearch">
```

To:
```html
<input data-event-oninput="handleSearch">
```
