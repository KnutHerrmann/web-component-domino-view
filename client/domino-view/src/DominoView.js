import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {AutoSizer, Column, Table, SortIndicator, SortDirection} from 'react-virtualized';
import Spinner from './Spinner';
import {css} from './css.js';
import {getUrlWithParams, convertTableData} from './utils';

class DominoView extends PureComponent {
  static propTypes = {
    server: PropTypes.string,
    db: PropTypes.string,
    view: PropTypes.string.isRequired,
    handleRowClick: PropTypes.func,
  };

  static initialState = {
    columns: undefined,
    rows: undefined,
    from: 0,
    to: 0,
    total: 0,
    sortIndex: [],
    sortColumn: '',
    sortDirection: SortDirection.ASC,
    scrollToIndex: undefined,
    errors: undefined,
  };

  state = DominoView.initialState;

  static MAX_COUNT_FETCH = 500;

  componentDidMount() {
    this.fetchTableData({from: 1});
  }

  componentDidUpdate(prevProps, prevState) {
    const {server, db, view} = this.props;
    const {sortColumn, sortDirection} = this.state;
    if (server !== prevProps.server || db !== prevProps.db || view !== prevProps.view) {
      this.setState(DominoView.initialState, () => this.fetchTableData({from: 1}));
    } else if (sortColumn !== prevState.sortColumn || sortDirection !== prevState.sortDirection) {
      this.sort({sortColumn, sortDirection});
    }
  }

  addErrorMessage = (message) => {
    const {errors = []} = this.state;
    if (errors.indexOf(message) < 0) {
      this.setState({errors: [...errors, message]});
    }
  };

  fetchTableData = ({from, sortColumn, sortDirection}) => {
    const {server, db, view} = this.props;
    const newSortColumn = sortColumn !== undefined ? sortColumn : this.state.sortColumn;
    const newSortDirection = sortDirection !== undefined ? sortDirection : this.state.sortDirection;
    const params = {
      server,
      db,
      from: from || this.state.scrollToIndex || 1,
      entries: DominoView.MAX_COUNT_FETCH,
      sortColumn: newSortColumn,
      sortDirection: newSortColumn ? newSortDirection : undefined,
    };
    this.setState({loadingFrom: params.from});
    fetch(getUrlWithParams('view/' + view, params), {method: 'GET', credentials: 'include'})
      .then((response) => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') >= 0) {
          return response.json();
        }
        throw new Error('Result format is not JSON.');
      })
      .then((data) => {
        if (this.state.loadingFrom !== params.from) {
          return; // another call to server is running meanwhile - ignore this one
        }
        const {status, error} = data;
        if (status === 'error' || error) {
          throw new Error(error);
        }
        this.setState({
          ...convertTableData(data),
          sortColumn: params.sortColumn,
          sortDirection: params.sortDirection,
          scrollToIndex: params.from === 1 ? 0 : undefined,
          errors: undefined,
        });
      })
      .catch((error) => {
        this.addErrorMessage('Could not read Domino view data: ' + error.message);
      });
  };

  sort = ({sortBy: sortColumn, sortDirection}) => {
    if (!sortColumn) {
      return;
    }
    const {columns = [], from, to, total} = this.state;
    const columnDefinition = columns.filter((col) => col.name === sortColumn)[0] || {};
    let newSortColumn = sortColumn;
    let newSortDirection = sortDirection;
    if (
      newSortColumn === this.state.sortColumn &&
      (this.state.sortDirection === SortDirection.DESC ||
        (this.state.sortDirection === SortDirection.ASC && !columnDefinition.sortdesc))
    ) {
      newSortColumn = '';
      newSortDirection = SortDirection.ASC;
    }
    if (from !== 1 || to < total) {
      // sort on server
      this.fetchTableData({from: 1, sortColumn: newSortColumn, sortDirection: newSortDirection});
      return;
    }
    // sort on client
    const {rows, sortIndex} = this.state;
    const newSortIndex = sortIndex.map((value, index) => index);
    if (newSortColumn) {
      const collator = new Intl.Collator('de', {sensitivity: 'base'});
      const comparer = (indexA, indexB) => {
        const a = rows[indexA];
        const b = rows[indexB];
        const valueA = a[newSortColumn + '_sort'] || a[newSortColumn];
        const valueB = b[newSortColumn + '_sort'] || b[newSortColumn];
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return collator.compare(valueA, valueB) * (newSortDirection === SortDirection.DESC ? -1 : 1);
        }
        if (valueA === valueB) {
          return 0;
        }
        if (newSortDirection === SortDirection.DESC) {
          return valueA < valueB ? 1 : -1;
        }
        return valueA > valueB ? 1 : -1;
      };
      newSortIndex.sort(comparer);
    }
    this.setState({
      scrollToIndex: 0,
      sortIndex: newSortIndex,
      sortColumn: newSortColumn,
      sortDirection: newSortDirection,
    });
  };

  headerRowRenderer = ({className, columns, style}) => {
    return (
      <div className={className} role="row" style={{...style, paddingRight: '0'}}>
        {columns}
      </div>
    );
  };

  headerRenderer = ({columnData, dataKey, disableSort, label, sortBy, sortDirection}) => (
    <div title={label} style={{textAlign: columnData.alignment, ...(!disableSort && {cursor: 'pointer'})}}>
      {label}
      {sortBy === dataKey && <SortIndicator sortDirection={sortDirection} />}
    </div>
  );

  getRowData = ({index}) => {
    const {rows, sortIndex, from, to} = this.state;
    if (index + 1 >= from && index + 1 <= to) {
      return rows[sortIndex[index - from + 1]];
    }
    return {};
  };

  static hasEnoughDataAround(startIndex, stopIndex, from, total) {
    const to = from + DominoView.MAX_COUNT_FETCH;
    const buffer = DominoView.MAX_COUNT_FETCH / 10;
    return (startIndex > from + buffer || from <= 1) && (stopIndex < to - buffer || to >= total);
  }

  onRowClick = ({rowData}) => {
    this.props.handleRowClick(rowData);
  };

  getRowClassName({index}) {
    if (index < 0) {
      return 'domino-view__header-row';
    } else {
      return index % 2 === 0 ? 'domino-view__even-row' : 'domino-view__odd-row';
    }
  }

  onRowsRendered = ({startIndex, stopIndex}) => {
    const {from, loadingFrom, total} = this.state;
    if (
      DominoView.hasEnoughDataAround(startIndex, stopIndex, from, total) ||
      (loadingFrom > 0 && DominoView.hasEnoughDataAround(startIndex, stopIndex, loadingFrom, total))
    ) {
      return;
    }
    // get more data in scroll direction than in other
    const lastStartIndex = this.lastStartIndex || 0;
    const overhang = DominoView.MAX_COUNT_FETCH - (stopIndex - startIndex);
    let newFrom = startIndex - overhang * (lastStartIndex < startIndex ? 0.2 : 0.8);
    this.lastStartIndex = startIndex;
    newFrom = newFrom < DominoView.MAX_COUNT_FETCH / 50 ? 1 : parseInt(newFrom, 10);
    this.fetchTableData({from: newFrom});
  };

  render() {
    const {errors, columns, rows, sortColumn, sortDirection, total = 0, scrollToIndex} = this.state;
    if (errors) {
      return (
        <div className="error" onClick={this.fetchTableData}>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      );
    }
    return (
      <>
        <style>{css}</style>
        {columns && rows ? (
          <div className="domino-view">
            <AutoSizer>
              {({height, width}) => {
                return (
                  <Table
                    width={width - 2}
                    height={height - 3}
                    headerHeight={25}
                    rowHeight={29}
                    rowCount={total}
                    rowGetter={this.getRowData}
                    rowClassName={this.getRowClassName}
                    scrollToAlignment="start"
                    scrollToIndex={scrollToIndex}
                    sort={this.sort}
                    sortBy={sortColumn}
                    sortDirection={sortDirection}
                    onRowClick={this.onRowClick}
                    onRowsRendered={this.onRowsRendered}
                    headerRowRenderer={this.headerRowRenderer}
                  >
                    {columns.map((col) => (
                      <Column
                        key={col.name}
                        label={col.label}
                        style={{textAlign: col.alignment}}
                        headerRenderer={this.headerRenderer}
                        disableSort={!(col.sortasc || col.sortdesc)}
                        defaultSortDirection={
                          col.sortasc ? SortDirection.ASC : col.sortdesc ? SortDirection.DESC : undefined
                        }
                        dataKey={col.name}
                        columnData={col}
                        width={col.width * 100}
                      />
                    ))}
                  </Table>
                );
              }}
            </AutoSizer>
          </div>
        ) : (
          <Spinner />
        )}
      </>
    );
  }
}

export default DominoView;
