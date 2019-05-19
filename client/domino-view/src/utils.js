export const getUrlWithParams = (path, params) => {
  const loc = window.location;
  const host = loc.host.indexOf('localhost') >= 0 ? 'server1:8088' : loc.host;
  return loc.protocol + '//' + host + '/WebComponents.nsf/api.xsp/' + path + convertObjectToUrlParams(params);
};

const convertObjectToUrlParams = (paramsObject) => {
  let params = Object.keys(paramsObject)
    .map((key) =>
      paramsObject[key]
        ? key + '=' + (Array.isArray(paramsObject[key]) ? JSON.stringify(paramsObject[key]) : paramsObject[key])
        : ''
    )
    .filter((entry) => !!entry)
    .join('&');
  return params && '?' + params;
};

export const convertTableData = (data) => {
  const {columns, rows, from, to, total} = data;
  const dateFormat = new Intl.DateTimeFormat(undefined, {day: '2-digit', month: '2-digit', year: 'numeric'});
  const convertedRows = rows.map((row, index) => {
    for (const colName of Object.keys(row)) {
      const colValue = row[colName];
      if (colValue && colValue.indexOf('T') === 10) {
        try {
          row[colName + '_sort'] = colValue;
          row[colName] = dateFormat.format(new Date(colValue));
        } catch (ignore) {}
      }
    }
    row['index'] = from + index;
    return row;
  });
  const sortIndex = rows.map((ignore, index) => index);
  return {
    columns: [{name: 'index', label: 'Nr.', width: 6}, ...columns],
    rows: convertedRows,
    from,
    to,
    total,
    sortIndex,
  };
};
