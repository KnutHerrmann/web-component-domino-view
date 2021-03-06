class DominoElement extends HTMLElement {
  static get observedAttributes() {
    return ["db", "view"];
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === "db") {
      this._db = newValue;
    } else if (attrName === "view") {
      this._view = newValue;
    }
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render = () => {
    this.innerHTML = `
    <h2>This will be our Domino view.</h2>
    <div>database ... <b>${this._db}</b></div>
    <div>view .......... <b>${this._view}</b></div>`;
  };
}

customElements.define("domino-view", DominoElement);
