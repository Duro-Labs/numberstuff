import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { diff, normalize, render } from './lib.mjs';

const spec = JSON.parse(readFileSync(new URL('./container.json', import.meta.url)));
const target = { measurementId: 'G-TEST' };

test('renders one variable per parameter plus the measurement ID constant', () => {
  const { variables } = render(spec, target);
  assert.equal(variables.length, spec.parameters.length + 1);
  const constant = variables.find((v) => v.name === 'GA4 measurement ID');
  assert.deepEqual(constant.parameter, [{ type: 'template', key: 'value', value: 'G-TEST' }]);
  assert.ok(variables.find((v) => v.name === 'dlv - form_id' && v.type === 'v'));
});

test('renders a custom event trigger and a consent-gated GA4 tag per event', () => {
  const { triggers, tags } = render(spec, target);
  assert.equal(triggers.length, spec.events.length);
  const lead = tags.find((t) => t.name === 'GA4 - generate_lead');
  assert.equal(lead.type, 'gaawe');
  assert.deepEqual(lead.firingTriggerNames, ['ev - generate_lead']);
  assert.equal(lead.consentSettings.consentStatus, 'needed');
  assert.deepEqual(lead.consentSettings.consentType.list, [{ type: 'template', value: 'analytics_storage' }]);
  const google = tags.find((t) => t.name === 'Google tag');
  assert.deepEqual(google.firingTriggerNames, ['All Pages']);
});

test('refuses a target without a measurement ID', () => {
  assert.throws(() => render(spec, { measurementId: null }), /measurementId/);
});

test('normalize ignores server fields and parameter order', () => {
  const a = { name: 'x', type: 'c', parameter: [{ type: 'template', key: 'b', value: '2' }, { type: 'template', key: 'a', value: '1' }], fingerprint: '1', path: 'p' };
  const b = { name: 'x', type: 'c', parameter: [{ type: 'template', key: 'a', value: '1' }, { type: 'template', key: 'b', value: '2' }] };
  assert.deepEqual(normalize(a), normalize(b));
});

test('diff creates, updates and removes by name', () => {
  const desired = [
    { name: 'keep', type: 'c', parameter: [{ type: 'template', key: 'value', value: '1' }] },
    { name: 'change', type: 'c', parameter: [{ type: 'template', key: 'value', value: 'new' }] },
    { name: 'add', type: 'c', parameter: [] },
  ];
  const current = [
    { name: 'keep', type: 'c', parameter: [{ type: 'template', key: 'value', value: '1' }], variableId: '1' },
    { name: 'change', type: 'c', parameter: [{ type: 'template', key: 'value', value: 'old' }], variableId: '2' },
    { name: 'stale', type: 'c', parameter: [], variableId: '3' },
  ];
  const result = diff(desired, current);
  assert.deepEqual(result.create.map((e) => e.name), ['add']);
  assert.deepEqual(result.update.map((u) => u.desired.name), ['change']);
  assert.deepEqual(result.remove.map((e) => e.name), ['stale']);
});
