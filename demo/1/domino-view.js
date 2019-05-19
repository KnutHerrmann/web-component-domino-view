class DominoElement extends HTMLElement {
  connectedCallback() {
    this.innerHTML = "<h2>This will be our Domino view.</h2>";
  }
}

customElements.define("domino-view", DominoElement);
