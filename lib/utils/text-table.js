import format from './format';

export default function textTable() {
  const rows = [];
  const instance = this;

  let MAX_LENGTH_PER_CELL = [];
  let MAX_LINES_PER_ROWS = [];
  let MAP_ROW_TYPE = [];
  let MAX_CELL_AMOUNT = 0;

  const api = {
    row: createRow,
    splitter: createSplitter,
    hr: createHR,
    label: createLabel,
    tableWrite: complete
  };

  function complete() {
    const maxLabelLength = Math.max(
      ...rows
        .filter((v, idx) => MAP_ROW_TYPE[idx] === 'label')
        .map(row => Math.max(...row[0].map(v => v.length)))
    );

    const maxRowLength = MAX_LENGTH_PER_CELL.reduce((a, b) => a + b, 0);

    if (maxLabelLength > maxRowLength) {
      const avgDiff = Math.round((maxLabelLength - maxRowLength) / MAX_CELL_AMOUNT);
      MAX_LENGTH_PER_CELL = MAX_LENGTH_PER_CELL.map(v => v + avgDiff);
    }

    const cellSplitter = '     ';

    const result = ''
      + rows.map((row, rowIdx) => {
        const isLabel = MAP_ROW_TYPE[rowIdx] === 'label';
        const isSplitter = MAP_ROW_TYPE[rowIdx] === 'splitter';
        const isHR = MAP_ROW_TYPE[rowIdx] === 'hr';
        const isLastRow = rowIdx === (rows.length - 1);

        const rowSplitter = isLastRow ? '' : '\n';

        if (isSplitter || isHR) {
          const cells = [];
          const cellSplitter = isSplitter ? '     ' : '-----';
          const padSym = isHR ? '-' : ' ';

          for (let cellIdx = 0; cellIdx < MAX_CELL_AMOUNT; cellIdx++) {
            const padding = MAX_LENGTH_PER_CELL[cellIdx];
            cells.push('--'.padEnd(padding, padSym));
          }

          return cells.join(cellSplitter) + rowSplitter;
        }

        const lines = [];

        for (let lineIdx = 0; lineIdx < MAX_LINES_PER_ROWS[rowIdx]; lineIdx++) {
          const cells = [];

          for (let cellIdx = 0; cellIdx < MAX_CELL_AMOUNT; cellIdx++) {
            const coll = row[cellIdx]
              ? (row[cellIdx][lineIdx] ? row[cellIdx][lineIdx] : '')
              : '';

            if (isLabel) {
              const padding = MAX_LENGTH_PER_CELL.reduce((a, b) => a + b + 2, 0) + 1;
              cells.push(coll.padEnd(padding, ' '));
              break;
            } else {
              const padding = MAX_LENGTH_PER_CELL[cellIdx];
              cells.push(coll.padEnd(padding, ' '));
            }
          }

          lines.push(cells.join(cellSplitter));
        }

        return lines.join('\n') + rowSplitter;
      }).join('');

    return instance.w(result);
  }

  function createCell(rowIdx, fmt, ...args) {
    const row = rows[rowIdx];
    const lines = format(String(fmt), ...args).split('\n');
    const cellIdx = row.length;

    MAX_LENGTH_PER_CELL[cellIdx] = Math.max(
      MAX_LENGTH_PER_CELL[cellIdx] || 4,
      ...lines.map(v => v.length)
    );

    MAX_LINES_PER_ROWS[rowIdx] = Math.max(
      MAX_LINES_PER_ROWS[rowIdx] || 1,
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

  function createSplitter() {
    createRow();
    MAP_ROW_TYPE[rows.length - 1] = 'splitter';
    return api;
  }

  function createHR() {
    createRow();
    MAP_ROW_TYPE[rows.length - 1] = 'hr';
    return api;
  }

  function createLabel(fmt, ...args) {
    createRow();
    const rowIdx = rows.length - 1;

      const cellLength = MAX_LENGTH_PER_CELL[0] || 0;
      createCell(rowIdx, fmt || '', ...args);
      MAX_LENGTH_PER_CELL[0] = cellLength;
      MAP_ROW_TYPE[rowIdx] = 'label';

    return api;
  }

  return api;
}
