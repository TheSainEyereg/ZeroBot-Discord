export const cookieHeaderParser = (cookie: string) =>
	cookie.split(";").map(c => c.split("=").map(c => c.trim())).map(([name, value]) => ({ name, value }));