export class ContextKeyNotDefinedError extends Error {
	public constructor(key: string) {
		super(`Context key "${key}" is not defined`);
		this.name = "ContextKeyNotDefinedError";
	}
}
