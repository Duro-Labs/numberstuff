export const BUILT_IN_TRIGGERS = { 'All Pages': '2147479553' };
export const MEASUREMENT_VARIABLE = 'GA4 measurement ID';

const CONSENT = {
  consentStatus: 'needed',
  consentType: { type: 'list', list: [{ type: 'template', value: 'analytics_storage' }] },
};

const dlv = (param) => `dlv - ${param}`;
const trigger = (event) => `ev - ${event}`;

export function render(spec, target) {
  if (!target.measurementId) {
    throw new Error('target has no measurementId; add it to gtm/targets.json first');
  }
  const variables = [
    { name: MEASUREMENT_VARIABLE, type: 'c', parameter: [{ type: 'template', key: 'value', value: target.measurementId }] },
    ...spec.parameters.map((param) => ({
      name: dlv(param),
      type: 'v',
      parameter: [
        { type: 'integer', key: 'dataLayerVersion', value: '2' },
        { type: 'boolean', key: 'setDefaultValue', value: 'false' },
        { type: 'template', key: 'name', value: param },
      ],
    })),
  ];
  const triggers = spec.events.map((event) => ({
    name: trigger(event.name),
    type: 'customEvent',
    customEventFilter: [
      {
        type: 'equals',
        parameter: [
          { type: 'template', key: 'arg0', value: '{{_event}}' },
          { type: 'template', key: 'arg1', value: event.name },
        ],
      },
    ],
  }));
  const tags = [
    {
      name: 'Google tag',
      type: 'googtag',
      parameter: [{ type: 'template', key: 'tagId', value: `{{${MEASUREMENT_VARIABLE}}}` }],
      firingTriggerNames: ['All Pages'],
      consentSettings: CONSENT,
    },
    ...spec.events.map((event) => ({
      name: `GA4 - ${event.name}`,
      type: 'gaawe',
      parameter: [
        { type: 'template', key: 'eventName', value: event.name },
        { type: 'template', key: 'measurementIdOverride', value: `{{${MEASUREMENT_VARIABLE}}}` },
        {
          type: 'list',
          key: 'eventSettingsTable',
          list: event.parameters.map((param) => ({
            type: 'map',
            map: [
              { type: 'template', key: 'parameter', value: param },
              { type: 'template', key: 'parameterValue', value: `{{${dlv(param)}}}` },
            ],
          })),
        },
      ],
      firingTriggerNames: [trigger(event.name)],
      consentSettings: CONSENT,
    })),
  ];
  return { variables, triggers, tags };
}

function sortParams(params) {
  return (params ?? [])
    .map((p) => {
      const out = { type: p.type, key: p.key, value: p.value };
      if (p.list) out.list = p.list.map((item) => (item.map ? { type: item.type, map: sortParams(item.map) } : { type: item.type, value: item.value }));
      if (p.map) out.map = sortParams(p.map);
      return JSON.parse(JSON.stringify(out));
    })
    .sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

export function normalize(entity) {
  const out = { name: entity.name, type: entity.type, parameter: sortParams(entity.parameter) };
  if (entity.customEventFilter) out.customEventFilter = entity.customEventFilter.map((f) => ({ type: f.type, parameter: sortParams(f.parameter) }));
  if (entity.consentSettings) out.consentSettings = entity.consentSettings;
  if (entity.firingTriggerNames) out.firingTriggerNames = [...entity.firingTriggerNames].sort();
  return out;
}

export function diff(desired, current) {
  const byName = new Map(current.map((e) => [e.name, e]));
  const wanted = new Set(desired.map((e) => e.name));
  const create = [];
  const update = [];
  for (const entity of desired) {
    const existing = byName.get(entity.name);
    if (!existing) {
      create.push(entity);
    } else if (JSON.stringify(normalize(entity)) !== JSON.stringify(normalize(existing))) {
      update.push({ desired: entity, current: existing });
    }
  }
  const remove = current.filter((e) => !wanted.has(e.name));
  return { create, update, remove };
}
