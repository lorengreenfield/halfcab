import halfcab, {
  html,
  css,
  injectMarkdown,
  defineRoute,
  gotoRoute,
  updateState,
  formField,
  formIsValid,
  getRouteComponent,
  state,
  nextTick
} from '../halfcab.mjs'

// Some demo styles using the css tag helper
const styles = css`
  .container {
    max-width: 880px;
    margin: 0 auto;
  }
  .counter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #8884;
  }
  .navLink.active {
    font-weight: 600;
    text-decoration: underline;
  }
  .card {
    padding: 12px;
    border: 1px solid #8884;
    border-radius: 8px;
    background: #00000008;
    margin: 12px 0;
  }
`

// Demo components
const Home = (args) => html`
  <section class="${styles.container}">
    <h2>Welcome to halfcab + lit demo</h2>
    <div class="${styles.card}">
      ${injectMarkdown(`
      ### Features shown
      - Client-side routing
      - Global state + rerender
      - CSS via css helper
      - Form helpers and validation
      - Markdown injection
      `)}
    </div>

    <div class="${styles.card}">
      <h3>Counter</h3>
      <div class="${styles.counter}">
        <button onclick=${() => updateState({ count: (state.count || 0) - 1 })} aria-label="decrement">–</button>
        <strong>${state.count || 0}</strong>
        <button onclick=${() => updateState({ count: (state.count || 0) + 1 })} aria-label="increment">+</button>
      </div>
    </div>
  </section>
`

const About = () => html`
  <section class="${styles.container}">
    <h2>About</h2>
    <p>This demo page is here to help you quickly test halfcab components and interactions.</p>
    <p>Source: <code>example/</code> directory.</p>
  </section>
`

const Form = () => {
  // A simple form using formField + validation
  state.form = state.form || { name: '', email: '' }
  const bindName = formField(state.form, 'name')
  const bindEmail = formField(state.form, 'email')
  const submit = (e) => {
    e.preventDefault()
    if (formIsValid(state.form)) {
      alert(`Submitted: ${state.form.name} <${state.form.email}>`)
    } else {
      alert('Form is invalid. Please fix errors.')
    }
  }
  return html`
    <section class="${styles.container}">
      <h2>Form</h2>
      <form onsubmit=${submit} novalidate>
        <div class="${styles.card}">
          <label>
            Name
            <input type="text" required placeholder="Ada Lovelace" oninput=${bindName} value="${state.form.name}" />
          </label>
        </div>
        <div class="${styles.card}">
          <label>
            Email
            <input type="email" required placeholder="ada@example.com" oninput=${bindEmail} value="${state.form.email}" />
          </label>
        </div>
        <button type="submit">Submit</button>
      </form>
    </section>
  `
}

// Define routes
defineRoute({ path: '/', title: 'Home', component: Home })
defineRoute({ path: '/about', title: 'About', component: About })
defineRoute({ path: '/form', title: 'Form', component: Form })

// Application shell
const Shell = () => {
  const pathname = (state.router && state.router.pathname) || '/'
  const NavLink = (to, label) => html`
    <a class="navLink ${pathname === to ? 'active' : ''}"
       href="${to}"
       onclick=${(e) => { e.preventDefault(); gotoRoute(to) }}>${label}</a>
  `

  const Current = getRouteComponent(pathname) || Home

  return html`
    <header>
      ${NavLink('/', 'Home')}
      ${NavLink('/about', 'About')}
      ${NavLink('/form', 'Form')}
    </header>
    <main>
      ${Current({})}
    </main>
  `
}

// Boot the app
halfcab({
  el: '#app',
  components: Shell
}).then(() => {
  // Ensure initial render after possible async state init
  nextTick(() => {})
}).catch((err) => {
  console.error('Failed to start halfcab demo:', err)
})
