module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	parserOptions: {
		ecmaVersion: "latest",
		sourceType: "module"
	},
	rules: {
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/member-delimiter-style": "error",
		indent: [
			"error",
			"tab",
			{ "SwitchCase": 1 }
		],
		quotes: [
			"error",
			"double"
		],
		semi: [
			"error",
			"always"
		]
	}
};