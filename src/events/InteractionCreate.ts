import Event from "../Event";
import { Events, GuildMember, Interaction } from "discord.js";
import { hasAccess } from "../components/checkManager";
import { critical, warning } from "../components/messages";

export default class InteractionCreate extends Event {
	event = Events.InteractionCreate;

	execute = async (interaction: Interaction) => {
		const { client } = interaction;

		if (!interaction.isChatInputCommand()) return;

		
		const command = client.commands.get(`${interaction.commandName}:${interaction.options.getSubcommand(false)}`) || client.commands.get(interaction.commandName);
		if (!command) return;

		if (!await hasAccess(interaction.member as GuildMember, command.access)) return interaction.reply({
			ephemeral: true,
			embeds: [
				warning("No access!", "This command requires higher level permissions")
			]
		});


		try {
			await command.executeSlash(interaction);
		} catch (e: unknown) {
			console.error(e);
			interaction[!interaction.deferred && !interaction.replied ? "reply" : !interaction.replied ? "editReply" : "followUp"]({
				ephemeral: true,
				embeds: [
					critical("Error occurred!", `\`\`\`\n${e}\n\`\`\``)
				]
			});
		}
	};
}