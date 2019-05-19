export const css = `
:host {
  all: initial;
  display: block;
  height: 100%;
}
:host([hidden]) {
  display: none;
}

.domino-view {
  font-size: .85em;
  border: 1px solid #ddd;
  height: calc( 100% - 2px);
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.domino-view__odd-row {
  background-color: #eeeeee;
}

.domino-view__header-row {
  color: var(--header-color);
}

.error {
  color: red;
}

/* addapted from node_modules/react-virtualized/styles.css */

.ReactVirtualized__Table__headerRow,
.ReactVirtualized__Table__row {
  align-items: center; 
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: row;
     -moz-box-orient: horizontal;
     -moz-box-direction: normal;
      -ms-flex-direction: row;
          flex-direction: row;
  -webkit-align-items: center;
     -moz-box-align: center;
      -ms-flex-align: center;
          align-items: center;
}


.ReactVirtualized__Table__headerRow {
  font-weight: 500;
  background: #fbfbfb;
  border-bottom: 1px solid #ddd;
}


.ReactVirtualized__Table__headerColumn,
.ReactVirtualized__Table__rowColumn {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin: 3px;
}

.ReactVirtualized__Grid:focus,
.ReactVirtualized__Table__headerColumn:focus{
  outline: none;
}

.ReactVirtualized__Table__row:focus  {
  outline: none;
  font-weight: 500;
}

.ReactVirtualized__Table__sortableHeaderIconContainer {
  display: flex;
  align-items: center;
}
.ReactVirtualized__Table__sortableHeaderIcon {
  flex: 0 0 24px;
  height: 1em;
  width: 1em;
  fill: currentColor;
}

.spinner {
  margin: 100px auto 0;
  width: 70px;
  text-align: center;
}

.spinner > div {
  width: 18px;
  height: 18px;
  background-color: #333;

  border-radius: 100%;
  display: inline-block;
  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
}

.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}

.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}

@-webkit-keyframes sk-bouncedelay {
  0%, 80%, 100% { -webkit-transform: scale(0) }
  40% { -webkit-transform: scale(1.0) }
}

@keyframes sk-bouncedelay {
  0%, 80%, 100% { 
    -webkit-transform: scale(0);
    transform: scale(0);
  } 40% { 
    -webkit-transform: scale(1.0);
    transform: scale(1.0);
  }
}
`;
