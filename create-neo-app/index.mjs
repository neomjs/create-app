#!/usr/bin/env node

import {forward} from './forward.mjs';

/**
 * @summary The `bin` of `create-neo-app`: `npm create neo-app` and `npm init neo-app` arrive here.
 *
 * The generator's own name stays `neo-app` (`npx neo-app`). This package only forwards to its latest
 * release, so it needs no release of its own when the generator changes.
 */
process.exit(forward(process.argv.slice(2)));
