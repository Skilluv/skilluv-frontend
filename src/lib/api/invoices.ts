import type { ApiResponse } from '$lib/types';
import { createApiClient } from './client';

const api = createApiClient();

// --- Types ---

export interface Invoice {
	id: string;
	invoice_number: string;
	enterprise_id: string;
	amount_ht_cents: number;
	amount_tva_cents: number;
	amount_ttc_cents: number;
	tva_rate_pct: number;
	currency: string;
	billing_country: string | null;
	billing_company_name: string | null;
	billing_address: string | null;
	billing_vat_number: string | null;
	description: string | null;
	stripe_payment_intent_id: string | null;
	stripe_session_id: string | null;
	related_transaction_id: string | null;
	issued_at: string;
	pdf_storage_key: string | null;
}

// --- API ---

export const invoicesApi = {
	/** Liste des factures de l'entreprise (paginée). */
	list(params?: { page?: number; per_page?: number; year?: number }) {
		return api.get<ApiResponse<{ invoices: Invoice[]; total: number; page: number }>>(
			'/enterprise/invoices',
			params as Record<string, string | number>
		);
	},

	/** URL de téléchargement du PDF (proxy backend qui gère les headers). */
	pdfUrl(invoiceId: string): string {
		return `/api/enterprise/invoices/${invoiceId}/pdf`;
	},

	/** Aperçu HTML d'une facture. */
	preview(invoiceId: string) {
		return api.get<{ html: string }>(`/enterprise/invoices/${invoiceId}/preview`);
	}
};
