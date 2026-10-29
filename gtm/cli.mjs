import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { call } from './api.mjs';
import { BUILT_IN_TRIGGERS, diff, render } from './lib.mjs';

const GTM = 'https://tagmanager.googleapis.com/tagmanager/v2/';
const GA = 'https://analyticsadmin.googleapis.com/v1beta/';
const WORKSPACE = 'numberstuff';
const read = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url)));

function validate() {
  const ajv = new Ajv({ allErrors: true });
  const check = ajv.compile(read('schema.json'));
  const spec = read('container.json');
  if (!check(spec)) {
    throw new Error(`container.json invalid: ${ajv.errorsText(check.errors)}`);
  }
  for (const event of spec.events) {
    for (const param of event.parameters) {
      if (!spec.parameters.includes(param)) throw new Error(`event ${event.name} uses undeclared parameter ${param}`);
    }
  }
  const targets = read('targets.json');
  for (const [name, t] of Object.entries(targets)) {
    for (const key of ['accountId', 'containerId', 'publicId']) {
      if (!t[key]) throw new Error(`target ${name} lacks ${key}`);
    }
  }
  console.log('container.json and targets.json are valid');
  return spec;
}

async function workspace(container) {
  const { workspace: list = [] } = await call('GET', `${GTM}${container}/workspaces`);
  return list.find((w) => w.name === WORKSPACE) ?? (await call('POST', `${GTM}${container}/workspaces`, { name: WORKSPACE }));
}

async function liveEntities(container) {
  try {
    const live = await call('GET', `${GTM}${container}/versions:live`);
    return { variables: live.variable ?? [], triggers: live.trigger ?? [], tags: live.tag ?? [] };
  } catch (error) {
    if (String(error.message).includes('→ 404')) return { variables: [], triggers: [], tags: [] };
    throw error;
  }
}

async function workspaceEntities(path) {
  const [v, tr, tg] = await Promise.all([
    call('GET', `${GTM}${path}/variables`),
    call('GET', `${GTM}${path}/triggers`),
    call('GET', `${GTM}${path}/tags`),
  ]);
  return { variables: v.variable ?? [], triggers: tr.trigger ?? [], tags: tg.tag ?? [] };
}

function withTriggerNames(tags, triggers) {
  const names = new Map(triggers.map((t) => [t.triggerId, t.name]));
  for (const [name, id] of Object.entries(BUILT_IN_TRIGGERS)) names.set(id, name);
  return tags.map((t) => ({ ...t, firingTriggerNames: (t.firingTriggerId ?? []).map((id) => names.get(id) ?? id) }));
}

function report(kind, d) {
  for (const e of d.create) console.log(`+ ${kind} ${e.name}`);
  for (const u of d.update) console.log(`~ ${kind} ${u.desired.name}`);
  for (const e of d.remove) console.log(`- ${kind} ${e.name}`);
}

async function apply(targetName, dryRun) {
  const spec = validate();
  const target = read('targets.json')[targetName];
  if (!target) throw new Error(`unknown target ${targetName}`);
  const desired = render(spec, target);
  const container = `accounts/${target.accountId}/containers/${target.containerId}`;

  if (dryRun) {
    const live = await liveEntities(container);
    const tags = withTriggerNames(live.tags, live.triggers);
    report('variable', diff(desired.variables, live.variables));
    report('trigger', diff(desired.triggers, live.triggers));
    report('tag', diff(desired.tags, tags));
    await ga4(spec, target, true);
    return;
  }

  const ws = await workspace(container);
  const current = await workspaceEntities(ws.path);
  const dv = diff(desired.variables, current.variables);
  const dt = diff(desired.triggers, current.triggers);
  report('variable', dv);
  report('trigger', dt);

  for (const e of dv.create) await call('POST', `${GTM}${ws.path}/variables`, e);
  for (const u of dv.update) await call('PUT', `${GTM}${u.current.path}`, u.desired);
  for (const e of dt.create) await call('POST', `${GTM}${ws.path}/triggers`, e);
  for (const u of dt.update) await call('PUT', `${GTM}${u.current.path}`, u.desired);

  const triggers = (await call('GET', `${GTM}${ws.path}/triggers`)).trigger ?? [];
  const ids = new Map(triggers.map((t) => [t.name, t.triggerId]));
  for (const [name, id] of Object.entries(BUILT_IN_TRIGGERS)) ids.set(name, id);
  const toWire = ({ firingTriggerNames, ...tag }) => ({ ...tag, firingTriggerId: firingTriggerNames.map((n) => ids.get(n)) });

  const currentTags = withTriggerNames((await call('GET', `${GTM}${ws.path}/tags`)).tag ?? [], triggers);
  const dg = diff(desired.tags, currentTags);
  report('tag', dg);
  for (const e of dg.create) await call('POST', `${GTM}${ws.path}/tags`, toWire(e));
  for (const u of dg.update) await call('PUT', `${GTM}${u.current.path}`, toWire(u.desired));
  for (const e of dg.remove) await call('DELETE', `${GTM}${e.path}`);
  for (const e of dt.remove) await call('DELETE', `${GTM}${e.path}`);
  for (const e of dv.remove) await call('DELETE', `${GTM}${e.path}`);

  const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const result = await call('POST', `${GTM}${ws.path}:create_version`, { name: `numberstuff ${sha}`, notes: 'Applied by gtm/cli.mjs' });
  if (result.compilerError) throw new Error('GTM reported a compiler error; open the workspace in the GTM UI');
  console.log(`created version ${result.containerVersion.containerVersionId} (${result.containerVersion.name})`);
  await ga4(spec, target, false);
}

async function ga4(spec, target, dryRun) {
  if (!target.ga4PropertyId) {
    console.log('GA4: no property for this target, skipped');
    return;
  }
  const property = `properties/${target.ga4PropertyId}`;
  const { keyEvents = [] } = await call('GET', `${GA}${property}/keyEvents`);
  const haveKey = new Set(keyEvents.map((k) => k.eventName));
  for (const event of spec.events.filter((e) => e.keyEvent && !haveKey.has(e.name))) {
    console.log(`+ GA4 key event ${event.name}`);
    if (!dryRun) await call('POST', `${GA}${property}/keyEvents`, { eventName: event.name, countingMethod: 'ONCE_PER_EVENT' });
  }
  const { customDimensions = [] } = await call('GET', `${GA}${property}/customDimensions`);
  const haveDim = new Set(customDimensions.map((d) => d.parameterName));
  for (const param of spec.parameters.filter((p) => !haveDim.has(p))) {
    console.log(`+ GA4 custom dimension ${param}`);
    if (!dryRun) await call('POST', `${GA}${property}/customDimensions`, { parameterName: param, displayName: param, scope: 'EVENT' });
  }
}

async function publish(targetName, versionId) {
  const target = read('targets.json')[targetName];
  if (!target || !versionId) throw new Error('usage: publish <target> <versionId>');
  const path = `accounts/${target.accountId}/containers/${target.containerId}/versions/${versionId}`;
  await call('POST', `${GTM}${path}:publish`);
  console.log(`published version ${versionId} of ${target.publicId}`);
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'validate') validate();
  else if (command === 'apply') await apply(args[0], args.includes('--dry-run'));
  else if (command === 'publish') await publish(args[0], args[1]);
  else throw new Error('usage: cli.mjs validate | apply <target> [--dry-run] | publish <target> <versionId>');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
