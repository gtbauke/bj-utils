import { LOGIN_CONTEXT_KEY, PASSWORD_CONTEXT_KEY, GOOGLE_SHEET_ID_CONTEXT_KEY, GOOGLE_EMAIL_CONTEXT_KEY, GOOGLE_KEY_CONTEXT_KEY } from "./constants.utils.js";
import { ContextKeyNotDefinedError } from "./errors/context-not-defined.error.js";

export class RequestContext {
	private readonly _context: Map<string, unknown>;

	public constructor() {
		this._context = new Map<string, unknown>();
	}

	public static createEnvAuthContext(): RequestContext {
		const context = new RequestContext();

		const login = process.env.LOGIN;
		const password = process.env.PASSWORD;
		const googleSheetId = process.env.GOOGLE_SPREADSHEET_ID;
		const googleEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
		const googleKey = process.env.GOOGLE_PRIVATE_KEY;

		context.set(LOGIN_CONTEXT_KEY, login);
		context.set(PASSWORD_CONTEXT_KEY, password);
		context.set(GOOGLE_SHEET_ID_CONTEXT_KEY, googleSheetId);
		context.set(GOOGLE_EMAIL_CONTEXT_KEY, googleEmail);
		context.set(GOOGLE_KEY_CONTEXT_KEY, googleKey);

		return context;
	}

	public set<T>(key: string, value: T): void {
		this._context.set(key, value);
	}

	public get<T>(key: string): T {
		const entry = this._context.get(key);

		if (entry === undefined) {
			throw new ContextKeyNotDefinedError(key);
		}

		return entry as T;
	}

	public has(key: string): boolean {
		return this._context.has(key);
	}

	public clear(): void {
		this._context.clear();
	}

	public delete(key: string): boolean {
		return this._context.delete(key);
	}

	public runWithContext<T>(
		fn: ((context: RequestContext) => Promise<T>)[],
	): Promise<T> {
		return fn.reduce(
			async (prev, curr) => {
				await prev;
				return curr(this);
			},
			Promise.resolve() as Promise<T>,
		);
	}
}
