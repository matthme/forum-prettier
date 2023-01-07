import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AppAgentClient, AppWebsocket, AppAgentWebsocket } from '@holochain/client';
import { provide } from '@lit-labs/context';
import '@material/mwc-circular-progress';

import { clientContext } from './contexts';

import './forum/posts/all-posts';
import { AllPosts } from './forum/posts/all-posts';
import './forum/posts/create-post';

@customElement('holochain-app')
export class HolochainApp extends LitElement {
  @state() loading = true;
  @state() result: string | undefined;

  @provide({ context: clientContext })
  @property({ type: Object })
  client!: AppAgentClient;

  async firstUpdated() {
    const appWebsocket = await AppWebsocket.connect(``);
    this.client = await AppAgentWebsocket.connect(appWebsocket, 'forum');

    this.loading = false;
  }

  get allPosts(): AllPosts | undefined {
    return this.shadowRoot?.getElementById('all-posts') as AllPosts;
  }

  render() {
    if (this.loading)
      return html`
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      `;

    return html`
      <main>
        <h1 style="color: #b3bdd6; font-size: 50px; margin-bottom: 60px;">Forum</h1>

        <div id="content" class="content">
          <create-post @post-created=${() => this.allPosts?._fetchPosts.run()} style="margin-bottom: 60px;"></create-post>
          <all-posts id="all-posts" style="margin-bottom: 16px"></all-posts>
        </div>
      </main>
    `;
  }

  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      font-size: calc(10px + 2vmin);
      color: #1a2b42;
      margin: 0 auto;
      text-align: center;
      background-color: #3d3d3d;
    }

    main {
      flex-grow: 1;
      width: 800px;
    }

    .content {
      display: flex;
      flex-direction: column;
    }

    .app-footer {
      font-size: calc(12px + 0.5vmin);
      align-items: center;
    }

    .app-footer a {
      margin-left: 5px;
    }
  `;
}
