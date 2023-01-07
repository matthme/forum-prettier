import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { AppAgentClient, AgentPubKey, EntryHash, ActionHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { Task } from '@lit-labs/task';
import { clientContext } from '../../contexts';
import '@material/mwc-circular-progress';

import './post-detail';

@customElement('all-posts')
export class AllPosts extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;


  _fetchPosts = new Task(this, ([]) => this.client.callZome({
      cap_secret: null,
      role_name: 'forum',
      zome_name: 'posts',
      fn_name: 'get_all_posts',
      payload: null,
  }) as Promise<Array<ActionHash>>, () => []);

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) return html`<span>No posts found.</span>`;

    return html`
      <div style="display: flex; flex-direction: column; align-items: center;">
        <span style="width: 100%; font-size: 22px; color: #b3bdd6; text-align: left; margin: 0 0 -7px 15px;">Read Posts</span>
        <hr style="width: 100%; background-color: #b3bdd6; margin-bottom: 30px; height: 2px; border: none; opacity: 0.2;">

        ${hashes.map(hash =>
          html`<post-detail .postHash=${hash} style="margin-bottom: 16px;" @post-deleted=${() => this._fetchPosts.run()}></post-detail>`
        )}
      </div>
    `;
  }

  render() {
    return this._fetchPosts.render({
      pending: () => html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: (hashes) => this.renderList(hashes),
      error: (e: any) => html`<span>Error fetching the posts: ${e.data.data}.</span>`
    });
  }
}
