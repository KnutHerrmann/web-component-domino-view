import React from "react";
import ReactDOM from "react-dom";
import DominoView from "./DominoView";

class DominoElement extends HTMLElement {
  static get observedAttributes() {
    return ["server", "db", "view"];
  }

  connectedCallback() {
    this._isConnected = true;
    this.render();
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === "server") {
      this._server = newValue;
    } else if (attrName === "db") {
      this._db = newValue;
    } else if (attrName === "view") {
      this._view = newValue;
    }
    this.render();
  }

  set server(server) {
    this.setAttribute("server", server);
  }
  get server() {
    return this.getAttribute("server");
  }

  set db(db) {
    this.setAttribute("db", db);
  }
  get db() {
    return this.getAttribute("db");
  }

  set view(view) {
    this.setAttribute("view", view);
  }
  get view() {
    return this.getAttribute("view");
  }

  render = () =>
    this._isConnected &&
    ReactDOM.render(
      <DominoView server={this._server} db={this._db} view={this._view} />,
      this
    );
}

customElements.define("domino-view", DominoElement);
