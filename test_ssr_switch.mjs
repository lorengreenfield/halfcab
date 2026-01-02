import { ssr, html } from './halfcab.mjs';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';

console.log('--- Testing SSR ---');

const items = ['A', 'B', 'C'];
const classes = { active: true, disabled: false };
const styles = { color: 'red', 'font-size': '20px' };
const fn = () => console.log('clicked');

const template = html`
  <div class="container">
    <h1>Hello SSR</h1>
    <div class=${classMap(classes)} style=${styleMap(styles)}>Styled</div>
    <ul>
      ${repeat(items, (item) => html`<li>${item}</li>`)}
    </ul>
    <div>${unsafeHTML('<span>Unsafe</span>')}</div>
    <button onclick=${fn}>Click</button>
    <button disabled=${null}>Disabled Null</button>
  </div>
`;

try {
  const result = ssr(template);
  console.log('Result componentsString:');
  console.log(result.componentsString);
} catch (e) {
  console.error('SSR Error:', e);
}
