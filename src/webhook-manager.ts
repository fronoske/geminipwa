// @ts-nocheck -- Enable after shared application service types are defined.
// Bundled into the generated index.html from this TypeScript source.
        const webhookUtils = {
            MAX_WEBHOOKS: 10,

            initialize() {
                elements.addWebhookBtn.addEventListener('click', () => this.addWebhook());
                this.renderList();
            },

            addWebhook() {
                if (state.settings.webhooks.length >= this.MAX_WEBHOOKS) {
                    uiUtils.showCustomAlert(`最大${this.MAX_WEBHOOKS}個までのWebhook URLを登録できます。`);
                    return;
                }
                const newWebhook = {
                    id: Date.now().toString(),
                    label: `Webhook ${state.settings.webhooks.length + 1}`,
                    url: '',
                    enabled: true,
                    format: 'text'
                };
                state.settings.webhooks.push(newWebhook);
                this.renderList();
            },

            async deleteWebhook(webhookId) {
                const webhook = state.settings.webhooks.find(w => w.id === webhookId);
                if (!webhook) return;

                const confirmed = await uiUtils.showCustomConfirm(`Webhook「${webhook.label}」を削除しますか？`);
                if (confirmed) {
                    state.settings.webhooks = state.settings.webhooks.filter(w => w.id !== webhookId);
                    this.renderList();
                }
            },

            updateWebhookValue(webhookId, key, value) {
                const webhook = state.settings.webhooks.find(w => w.id === webhookId);
                if (webhook) {
                    webhook[key] = value;
                }
            },

            renderList() {
                const container = elements.webhooksList;
                container.innerHTML = '';
                state.settings.webhooks.forEach(webhook => {
                    container.appendChild(this.createWebhookItem(webhook));
                });
                elements.addWebhookBtn.disabled = state.settings.webhooks.length >= this.MAX_WEBHOOKS;
            },

            createWebhookItem(webhook) {
                const item = document.createElement('div');
                item.className = 'api-key-item';
                item.style.flexDirection = 'column';
                item.dataset.webhookId = webhook.id;

                const row1 = document.createElement('div');
                row1.style.display = 'flex';
                row1.style.gap = '8px';
                row1.style.alignItems = 'center';

                const enabledCheckbox = document.createElement('input');
                enabledCheckbox.type = 'checkbox';
                enabledCheckbox.checked = webhook.enabled;
                enabledCheckbox.title = 'このWebhookを有効/無効にする';
                enabledCheckbox.addEventListener('change', (e) => this.updateWebhookValue(webhook.id, 'enabled', e.target.checked));

                const labelInput = document.createElement('input');
                labelInput.type = 'text';
                labelInput.value = webhook.label;
                labelInput.placeholder = 'ラベル (例: Slack通知)';
                labelInput.className = 'api-key-item-label';
                labelInput.addEventListener('change', (e) => this.updateWebhookValue(webhook.id, 'label', e.target.value));

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '削';
                deleteBtn.className = 'api-key-delete-btn';
                deleteBtn.addEventListener('click', () => this.deleteWebhook(webhook.id));

                row1.appendChild(enabledCheckbox);
                row1.appendChild(labelInput);
                row1.appendChild(deleteBtn);

                const row2 = document.createElement('div');
                row2.style.display = 'flex';
                row2.style.gap = '8px';
                row2.style.marginTop = '5px';

                const urlInput = document.createElement('input');
                urlInput.type = 'text';
                urlInput.value = webhook.url;
                urlInput.placeholder = 'https://...';
                urlInput.className = 'api-key-item-input';
                urlInput.style.flexGrow = '1';
                urlInput.addEventListener('change', (e) => this.updateWebhookValue(webhook.id, 'url', e.target.value));

                const formatSelect = document.createElement('select');
                formatSelect.innerHTML = `<option value="json">JSON</option><option value="text">Text</option>`;
                formatSelect.value = webhook.format;
                formatSelect.style.width = '80px';
                formatSelect.className = 'api-key-item-input';
                formatSelect.addEventListener('change', (e) => this.updateWebhookValue(webhook.id, 'format', e.target.value));

                row2.appendChild(urlInput);
                row2.appendChild(formatSelect);

                item.appendChild(row1);
                item.appendChild(row2);
                return item;
            }
        };
