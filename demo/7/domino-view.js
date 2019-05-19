const template = document.createElement("template");
template.innerHTML = `
<style>
  .headline {
    margin: 2em 0 1em;
    font-size: 1.3em;
    font-weight: bold;
    color: darkblue;
  }
  slot {
    color: red;
    padding: 1em;
  }
  .row {
    margin-bottom: 1em;
  }
  label {
    float: left;
    width: 7em;
  }
  .value {
    font-weight: bold
  }
</style>
<div class="headline">This is an example for Templates. <slot></slot></div>
<div class="row">
  <label>database</label>
  <span class="value" id="db" />
</div>
<div class="row">
  <label>view</label>
  <span class="value" id="view" />
</div>
`;

class DominoElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return ["db", "view"];
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === "db") {
      this._db = newValue;
      this.shadowRoot.querySelector("#db").innerHTML = this._db;
    } else if (attrName === "view") {
      this._view = newValue;
      this.shadowRoot.querySelector("#view").innerHTML = this._view;
    }
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
}

customElements.define("domino-view", DominoElement);
