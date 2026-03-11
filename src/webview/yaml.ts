const appendYamlLine = (lines: string[], indentLevel: number, line: string) => {
  lines.push(`${'  '.repeat(indentLevel)}${line}`);
};

const formatYamlScalar = (value: unknown) => {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
};

export const toYamlString = (value: unknown, indentLevel = 0): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    const lines: string[] = [];
    value.forEach((item) => {
      if (item !== null && typeof item === 'object') {
        appendYamlLine(lines, indentLevel, '-');
        lines.push(toYamlString(item, indentLevel + 1));
        return;
      }

      appendYamlLine(lines, indentLevel, `- ${formatYamlScalar(item)}`);
    });
    return lines.join('\n');
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }

    const lines: string[] = [];
    entries.forEach(([key, item]) => {
      if (item !== null && typeof item === 'object') {
        appendYamlLine(lines, indentLevel, `${key}:`);
        lines.push(toYamlString(item, indentLevel + 1));
        return;
      }

      appendYamlLine(lines, indentLevel, `${key}: ${formatYamlScalar(item)}`);
    });
    return lines.join('\n');
  }

  return formatYamlScalar(value);
};
