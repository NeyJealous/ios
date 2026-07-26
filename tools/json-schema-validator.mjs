function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function resolveLocalRef(rootSchema, ref) {
  if (!ref.startsWith('#/')) throw new Error(`Unsupported non-local schema reference: ${ref}`);
  return ref.slice(2).split('/').reduce((value, token) => {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!value || !(key in value)) throw new Error(`Unresolved schema reference: ${ref}`);
    return value[key];
  }, rootSchema);
}

function isDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

function isUri(value) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return Boolean(parsed.protocol && parsed.hostname);
  } catch {
    return false;
  }
}

export function validateJsonSchema(value, schema, options = {}) {
  const rootSchema = options.rootSchema || schema;
  const startPath = options.path || '$';
  const errors = [];

  function visit(current, rule, path) {
    if (!rule || typeof rule !== 'object') {
      errors.push(`${path}: invalid schema node`);
      return;
    }
    if (rule.$ref) {
      visit(current, resolveLocalRef(rootSchema, rule.$ref), path);
      return;
    }

    for (const item of rule.allOf || []) visit(current, item, path);
    if (rule.if) {
      const before = errors.length;
      visit(current, rule.if, path);
      const conditionMatched = errors.length === before;
      errors.splice(before);
      if (conditionMatched && rule.then) visit(current, rule.then, path);
      if (!conditionMatched && rule.else) visit(current, rule.else, path);
    }

    if ('const' in rule && !sameJson(current, rule.const)) errors.push(`${path}: must equal schema const`);
    if (rule.enum && !rule.enum.some((candidate) => sameJson(current, candidate))) errors.push(`${path}: value is not in enum`);

    if (rule.type) {
      const allowed = Array.isArray(rule.type) ? rule.type : [rule.type];
      const actual = valueType(current);
      const matches = allowed.includes(actual) || (actual === 'integer' && allowed.includes('number'));
      if (!matches) {
        errors.push(`${path}: expected ${allowed.join('|')}, got ${actual}`);
        return;
      }
    }

    if (typeof current === 'string') {
      if (rule.minLength !== undefined && current.length < rule.minLength) errors.push(`${path}: shorter than minLength ${rule.minLength}`);
      if (rule.maxLength !== undefined && current.length > rule.maxLength) errors.push(`${path}: longer than maxLength ${rule.maxLength}`);
      if (rule.pattern !== undefined && !new RegExp(rule.pattern, 'u').test(current)) errors.push(`${path}: does not match pattern ${rule.pattern}`);
      if (rule.format === 'date-time' && !isDateTime(current)) errors.push(`${path}: invalid date-time`);
      if (rule.format === 'uri' && !isUri(current)) errors.push(`${path}: invalid uri`);
    }

    if (Array.isArray(current)) {
      if (rule.minItems !== undefined && current.length < rule.minItems) errors.push(`${path}: fewer than minItems ${rule.minItems}`);
      if (rule.uniqueItems && new Set(current.map((item) => JSON.stringify(item))).size !== current.length) errors.push(`${path}: items must be unique`);
      if (rule.items) current.forEach((item, index) => visit(item, rule.items, `${path}[${index}]`));
      if (rule.contains) {
        let matches = 0;
        for (const item of current) {
          const before = errors.length;
          visit(item, rule.contains, `${path}[*]`);
          if (errors.length === before) matches += 1;
          else errors.splice(before);
        }
        if (matches < (rule.minContains ?? 1)) errors.push(`${path}: contains matched ${matches}, expected at least ${rule.minContains ?? 1}`);
      }
    }

    if (current && typeof current === 'object' && !Array.isArray(current)) {
      for (const key of rule.required || []) if (!(key in current)) errors.push(`${path}: missing required property ${key}`);
      const properties = rule.properties || {};
      for (const [key, item] of Object.entries(current)) {
        if (properties[key]) visit(item, properties[key], `${path}.${key}`);
        else if (rule.additionalProperties === false) errors.push(`${path}: unexpected property ${key}`);
        else if (rule.additionalProperties && typeof rule.additionalProperties === 'object') visit(item, rule.additionalProperties, `${path}.${key}`);
      }
    }
  }

  visit(value, schema, startPath);
  return errors;
}
