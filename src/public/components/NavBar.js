class NavBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const userEmail = localStorage.getItem('userEmail');
    const isAuthenticated = !!localStorage.getItem('token');

    this.shadowRoot.innerHTML = `
      <style>
        nav {
          background-color: #1a1a1a;
          padding: 1rem;
          color: white;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand {
          font-size: 1.5rem;
          font-weight: bold;
          text-decoration: none;
          color: white;
        }
        .nav-links {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .user-info {
          margin-right: 1rem;
          color: #ccc;
        }
        button {
          background: transparent;
          border: 1px solid white;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        button:hover {
          background: white;
          color: #1a1a1a;
        }
      </style>
      <nav>
        <div class="container">
          <a href="/" class="brand">StrataDesk</a>
          <div class="nav-links">
            ${isAuthenticated ? `
              <span class="user-info">${userEmail}</span>
              <button onclick="this.getRootNode().host.logout()">Logout</button>
            ` : `
              <a href="/auth/login" style="color: white; text-decoration: none;">Login</a>
            `}
          </div>
        </div>
      </nav>
    `;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/';
  }
}

customElements.define('nav-bar', NavBar); 