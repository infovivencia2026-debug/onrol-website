/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SURVEY_SHEETS_WEBHOOK_URL?: string;
	readonly VITE_APPS_SCRIPT_CAREER_CATALYST_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
