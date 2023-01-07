import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash, AppAgentClient } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { Task } from '@lit-labs/task';
import { decode } from '@msgpack/msgpack';
import '@material/mwc-circular-progress';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';

import './edit-post';

import { clientContext } from '../../contexts';
import { Post } from './types';

@customElement('post-detail')
export class PostDetail extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;

  @property({
    hasChanged: (newVal: ActionHash, oldVal: ActionHash) => newVal?.toString() !== oldVal?.toString()
  })
  postHash!: ActionHash;

  _fetchRecord = new Task(this, ([postHash]) => this.client.callZome({
      cap_secret: null,
      role_name: 'forum',
      zome_name: 'posts',
      fn_name: 'get_post',
      payload: postHash,
  }) as Promise<Record | undefined>, () => [this.postHash]);

  @state()
  _editing = false;

  async deletePost() {
    try {
      await this.client.callZome({
        cap_secret: null,
        role_name: 'forum',
        zome_name: 'posts',
        fn_name: 'delete_post',
        payload: this.postHash,
      });
      this.dispatchEvent(new CustomEvent('post-deleted', {
        bubbles: true,
        composed: true,
        detail: {
          postHash: this.postHash
        }
      }));
      this._fetchRecord.run();
    } catch (e: any) {
      const errorSnackbar = this.shadowRoot?.getElementById('delete-error') as Snackbar;
      errorSnackbar.labelText = `Error deleting the post: ${e.data.data}`;
      errorSnackbar.show();
    }
  }

  renderDetail(record: Record) {
    const post = decode((record.entry as any).Present.entry) as Post;

    return html`
      <mwc-snackbar id="delete-error" leading>
      </mwc-snackbar>

      <div style="display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 16px; background: #9aa3ba; border-radius: 10px; box-shadow: 1px 1px 2px black; padding: 10px 20px 20px 20px;">
        <div style="display: flex; flex-direction: row; align-items: center; width: 100%; margin-bottom: 12px;">
          <div style="font-size: 26px; font-weight: bold; text-align: left;">${ post.title }</div>
          <span style="display: flex; flex: 1;"></span>
          <mwc-icon-button style="margin-left: 8px" icon="edit" title="edit" @click=${() => { this._editing = true; } }></mwc-icon-button>
          <mwc-icon-button style="margin-left: 8px" icon="delete" title="delete" @click=${() => this.deletePost()}></mwc-icon-button>
        </div>

        <div style="width: 100%; text-align: left; font-size: 20px;">${ post.content }</div>

      </div>
    `;
  }

  renderPost(maybeRecord: Record | undefined) {
    if (!maybeRecord) return html`<span>The requested post was not found.</span>`;

    if (this._editing) {
    	return html`
      <div style="
        display: flex;
        flex:1;
        flex-direction: column;
        align-items: center;
        border: 1px solid #b3bdd6;
        border-radius: 10px;
        padding: 30px 20px 20px 20px;
        position: relative;
        margin-top: 20px;
        margin-bottom: 16px;
      ">
        <span style="position: absolute; top: -25px; left: 10px; font-size: 18px; color: #b3bdd6;">Edit</span>
        <edit-post
          .originalPostHash=${this.postHash}
          .currentRecord=${maybeRecord}
          @post-updated=${async () => {
            this._editing = false;
            await this._fetchRecord.run();
          } }
          @edit-canceled=${() => { this._editing = false; } }
          style="display: flex; flex: 1; width: 95%;"
        ></edit-post>
      </div>`;
    }

    return this.renderDetail(maybeRecord);
  }

  render() {
    return this._fetchRecord.render({
      pending: () => html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`,
      complete: (maybeRecord) => this.renderPost(maybeRecord),
      error: (e: any) => html`<span>Error fetching the post: ${e.data.data}</span>`
    });
  }
}
