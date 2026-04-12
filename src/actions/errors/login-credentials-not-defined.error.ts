export class LoginCredentialsNotDefinedError extends Error {
	public constructor() {
		super("Login credentials are not defined in the request context.");
		this.name = "LoginCredentialsNotDefinedError";
	}
}
