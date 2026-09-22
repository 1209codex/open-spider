// src/plugins/plugin-manager.js
/**
 * Minimal plugin manager for Open‑spider.
 * Plugins are installed as regular npm packages inside the user data directory
 * `${getPluginsDir()}`. Each plugin must contain a `package.json` with the field
 * `open-spider-plugin` set to `true` so we can recognise it.
 */
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPluginsDir } from '../core/paths.js';

/** Ensure the plugins directory exists. */
function ensurePluginsDir() {
  const dir = getPluginsDir();
  if (!existsSync(dir)) {
    execSync(`mkdir -p ${dir}`);
  }
}

/** List installed plugins that declare `open-spider-plugin`. */
export function listPlugins() {
  ensurePluginsDir();
  const dir = getPluginsDir();
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  return entries.filter((name) => {
    const pkgPath = join(dir, name, 'package.json');
    if (!existsSync(pkgPath)) return false;
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      return Boolean(pkg['open-spider-plugin']);
    } catch {
      return false;
    }
  });
}

/** Install a plugin via npm into the plugins directory.
 * @param {string} spec – npm spec (e.g., package name, git url, local path).
 */
export function installPlugin(spec) {
  ensurePluginsDir();
  const dir = getPluginsDir();
  // Use npm to install directly into the plugins directory.
  // --prefix makes npm treat the directory as the project root.
  execSync(`npm install ${spec} --prefix ${dir} --no-save`, { stdio: 'inherit' });
}

/** Remove an installed plugin by name. */
export function removePlugin(name) {
  const dir = join(getPluginsDir(), name);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Load plugin modules (their main entry) for side‑effects.
 * This can be used by the runtime to auto‑register workers, UI helpers, etc.
 */
export function loadPlugins() {
  const plugins = listPlugins();
  const dir = getPluginsDir();
  plugins.forEach((name) => {
    const pluginPath = join(dir, name);
    try {
      // Dynamically import the plugin's main file.
      // eslint-disable-next-line no‑eval
      import(pluginPath).catch(() => {});
    } catch (e) {
      // Swallow errors – a faulty plugin should not break the core.
    }
  });
}
