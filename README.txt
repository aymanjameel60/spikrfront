Spike v20 — Mercur Full Connected Prototype

This build extends v19 from product-only integration into a broad customer storefront integration.
See MERCUR_SETUP.txt before running.

Main architecture:
Spike HTML/CSS/JS -> Mercur/Medusa Store API :9000 -> PostgreSQL/Redis -> Admin/Vendor dashboards

No Admin secret is embedded in this frontend. The storefront uses a Publishable API Key, and customer auth tokens are stored locally in the browser during development.
