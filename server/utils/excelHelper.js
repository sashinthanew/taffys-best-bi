// Excel styling helper functions

// Style the header row
function styleHeaderRow(row) {
  row.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  row.alignment = { vertical: 'middle', horizontal: 'center' };
  row.height = 25;
  
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });
}

// Style the total row
function styleTotalRow(row) {
  row.font = { bold: true, size: 11 };
  row.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7E6E6' }
  };
  row.alignment = { vertical: 'middle', horizontal: 'right' };
  
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });
}

// Add borders to all cells in the worksheet
function addBordersToSheet(worksheet) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) { // Skip header row (already styled)
      row.eachCell((cell) => {
        if (!cell.border || !cell.border.top) { // Don't override existing borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
    }
  });
}

// Format currency cell
function formatCurrency(cell, value) {
  cell.value = value;
  cell.numFmt = '$#,##0.00';
  cell.alignment = { horizontal: 'right' };
}

// Format number cell
function formatNumber(cell, value, decimals = 2) {
  cell.value = value;
  const format = decimals === 0 ? '#,##0' : `#,##0.${'0'.repeat(decimals)}`;
  cell.numFmt = format;
  cell.alignment = { horizontal: 'right' };
}

// Format date cell
function formatDate(cell, value) {
  cell.value = value;
  cell.numFmt = 'mm/dd/yyyy';
  cell.alignment = { horizontal: 'center' };
}

// Add title to worksheet
function addTitle(worksheet, title, columnCount) {
  worksheet.mergeCells(1, 1, 1, columnCount);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF000000' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' }
  };
  worksheet.getRow(1).height = 30;
}

// Color code cells based on value (for positive/negative values)
function colorCodeValue(cell, value, positiveColor = 'FF00AA00', negativeColor = 'FFAA0000') {
  if (value > 0) {
    cell.font = { color: { argb: positiveColor }, bold: true };
  } else if (value < 0) {
    cell.font = { color: { argb: negativeColor }, bold: true };
  }
}

// Add alternating row colors for better readability
function addAlternatingRowColors(worksheet, startRow = 2) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= startRow && rowNumber % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      };
    }
  });
}

// Freeze header row and first column
function freezeHeaderRow(worksheet) {
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];
}

// Auto-fit column widths based on content
function autoFitColumns(worksheet) {
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 2;
  });
}

module.exports = {
  styleHeaderRow,
  styleTotalRow,
  addBordersToSheet,
  formatCurrency,
  formatNumber,
  formatDate,
  addTitle,
  colorCodeValue,
  addAlternatingRowColors,
  freezeHeaderRow,
  autoFitColumns
};
