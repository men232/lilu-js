import format from './format';

export default function textTable() {
  const rows = [];
  const instance = this;

  let MAX_LENGTH_PER_CELL = [];
  let MAX_LINES_PER_ROWS = [];
  let MAP_IS_ROW_LABEL = [];
  let MAX_CELL_AMOUNT = 0;

  const api = {
    row: createRow,
    label: createLabel,
    tableWrite: complete
  };

  function complete() {
    const isLabelFirst = !!MAP_IS_ROW_LABEL[0];
    const isLabelLast = !!MAP_IS_ROW_LABEL[rows.length - 1];

    const maxLabelLength = Math.max(0,
      ...rows
        .filter((v, idx) => !!MAP_IS_ROW_LABEL[idx])
        .map(row => Math.max(...row[0].map(v => v.length)))
    );

    const maxRowLength = MAX_LENGTH_PER_CELL.reduce((a, b) => a + b, 0);

    if (maxLabelLength > maxRowLength) {
      const avgDiff = Math.round((maxLabelLength - maxRowLength) / MAX_CELL_AMOUNT);
      MAX_LENGTH_PER_CELL = MAX_LENGTH_PER_CELL.map(v => v + avgDiff);
    }

    const start = '┌' + MAX_LENGTH_PER_CELL
      .map(len => ''.padStart(len + 2, '─'))
      .join(isLabelFirst ? '─' : '┬') + '┐\n';

    const end = '\n└' + MAX_LENGTH_PER_CELL
      .map(len => ''.padStart(len + 2, '─'))
      .join(isLabelLast ? '─' : '┴') + '┘';

    const result = ''
      + start
      + rows.map((row, rowIdx) => {
        const lines = [];
        const isLabel = !!MAP_IS_ROW_LABEL[rowIdx];
        const isNextLabel = !!MAP_IS_ROW_LABEL[rowIdx + 1];
        const isLastRow = rowIdx === (rows.length - 1);

        const rowSplitter = '\n├' + MAX_LENGTH_PER_CELL
          .map(len => ''.padStart(len + 2, '─'))
          .join(
            isLabel
              ? (isLastRow || isNextLabel ? '─' : '┬')
              : (isNextLabel ? '┴' : '┼')
          ) + '┤\n';

        const cellSplitter = isLabel
          ? '   '
          : ' │ ';

        for (let lineIdx = 0; lineIdx < MAX_LINES_PER_ROWS[rowIdx]; lineIdx++) {
          const cells = [];

          for (let cellIdx = 0; cellIdx < MAX_CELL_AMOUNT; cellIdx++) {
            const coll = row[cellIdx]
              ? (row[cellIdx][lineIdx] ? row[cellIdx][lineIdx] : '')
              : '';

            if (isLabel) {
              const maxLen = (
                MAX_LENGTH_PER_CELL.reduce((a, b) => a + b, 0) +
                Math.max((MAX_LENGTH_PER_CELL.length - 1) * 3, 0)
              );
              cells.push(coll.padEnd(maxLen, ' '));
              break;
            } else {
              const maxLen = MAX_LENGTH_PER_CELL[cellIdx];
              cells.push(coll.padEnd(maxLen, ' '));
            }
          }

          lines.push('│ ' + cells.join(cellSplitter) + ' │');
        }

        return lines.join('\n') + (isLastRow ? '' : rowSplitter);
      }).join('')
      + end
    ;

    return instance.w(result);
  }

  function createCell(rowIdx, fmt, ...args) {
    const row = rows[rowIdx];
    const lines = format(String(fmt), ...args).split('\n');
    const cellIdx = row.length;

    MAX_LENGTH_PER_CELL[cellIdx] = Math.max(
      MAX_LENGTH_PER_CELL[cellIdx] || 0,
      ...lines.map(v => v.length)
    );

    MAX_LINES_PER_ROWS[rowIdx] = Math.max(
      MAX_LINES_PER_ROWS[rowIdx] || 0,
      lines.length
    );

    MAX_CELL_AMOUNT = Math.max(MAX_CELL_AMOUNT, cellIdx + 1);
    row.push(lines);

    return {
      ...api,
      cell: createCell.bind(null, rowIdx)
    }
  }

  function createRow() {
    const row = [];
    const rowIdx = rows.push(row) - 1;

    return {
      ...api,
      cell: createCell.bind(null, rowIdx)
    }
  }

  function createLabel(fmt, ...args) {
    createRow();
    const rowIdx = rows.length - 1;

      const cellLength = MAX_LENGTH_PER_CELL[0] || 0;
      createCell(rowIdx, fmt || '', ...args);
      MAX_LENGTH_PER_CELL[0] = cellLength;
      MAP_IS_ROW_LABEL[rowIdx] = true;

    return api;
  }

  return api;
}
