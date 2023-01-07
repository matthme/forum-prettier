import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { InstalledCell, ActionHash, Record, AgentPubKey, EntryHash, AppAgentClient } from '@holochain/client';
import { consume } from '@lit-labs/context';
import '@material/mwc-button';
import '@material/mwc-snackbar';
import { Snackbar } from '@material/mwc-snackbar';
import '@material/mwc-textfield';
import '@material/mwc-textarea';

import { clientContext } from '../../contexts';
import { Post } from './types';

@customElement('create-post')
export class CreatePost extends LitElement {
  @consume({ context: clientContext })
  client!: AppAgentClient;


  @state()
  _title: string | undefined;

  @state()
  _content: string | undefined;


  isPostValid() {
    return true && this._title !== undefined && this._content !== undefined && this._title !== "" && this._content !== "";
  }

  async createPost() {
    const post: Post = {
        title: this._title!,
        content: this._content!,
    };

    try {
      const record: Record = await this.client.callZome({
        cap_secret: null,
        role_name: 'forum',
        zome_name: 'posts',
        fn_name: 'create_post',
        payload: post,
      });

      this.dispatchEvent(new CustomEvent('post-created', {
        composed: true,
        bubbles: true,
        detail: {
          postHash: record.signed_action.hashed.hash
        }
      }));
    } catch (e: any) {
      const errorSnackbar = this.shadowRoot?.getElementById('create-error') as Snackbar;
      errorSnackbar.labelText = `Error creating the post: ${e.data.data}`;
      errorSnackbar.show();
    }
  }

  render() {
    return html`
      <mwc-snackbar id="create-error" leading>
      </mwc-snackbar>

      <div style="display: flex; width: 100%; flex-direction: column; align-items: center;">
        <span style="width: 100%; font-size: 22px; color: #b3bdd6; text-align: left; margin: 0 0 -7px 15px;">Create Post</span>
        <hr style="width: 100%; background-color: #b3bdd6; margin-bottom: 30px; height: 2px; border: none; opacity: 0.2;">

          <div style="margin-bottom: 16px; width: 100%;">
            <mwc-textfield
              style="
                --mdc-theme-primary: #b3bdd6;
                width: 100%;
                --mdc-theme-error: #9d3437;
                --mdc-text-field-ink-color: #b3bdd6;
                --mdc-text-field-outlined-idle-border-color: #606572;
                --mdc-text-field-outlined-hover-border-color: #b3bdd6;
                --mdc-text-field-label-ink-color: #b3bdd6;
                --mdc-text-field-filled-border-radius: 10px 10px;
              "
              outlined
              label="Title"
              @input=${(e: CustomEvent) => { this._title = (e.target as any).value; } }
              required
            ></mwc-textfield>
          </div>

          <div style="margin-bottom: 16px; width: 100%;">
            <mwc-textarea
              style="
                --mdc-theme-primary: #b3bdd6;
                width: 100%;
                color: #b3bdd6;
                --mdc-theme-error: #9d3437;
                --mdc-text-field-ink-color: #b3bdd6;
                --mdc-text-field-outlined-idle-border-color: #606572;
                --mdc-text-field-outlined-hover-border-color: #b3bdd6;
                --mdc-text-field-label-ink-color: #b3bdd6;
                height: 200px;
              "
              outlined
              label="Content"
              @input=${(e: CustomEvent) => { this._content = (e.target as any).value;} }
              required
            ></mwc-textarea>
          </div>


        <mwc-button
          style="
            --mdc-button-disabled-fill-color: #606572;
            --mdc-theme-primary: #3a5599;
            width: 200px;
          "
          icon="rocket_launch"
          raised
          label="Create Post"
          .disabled=${!this.isPostValid()}
          @click=${() => this.createPost()}
        ></mwc-button>
    </div>`;
  }
}
