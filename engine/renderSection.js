/**
 * renderSection.js
 * ----------------
 * Render 1 section bất kỳ của thủ tục
 * Trả về: { reply, choices }
 */

export function renderSection(procedure, sectionKey) {
  const section = procedure.sections?.[sectionKey];

  if (!section) {
    return {
      reply: "⚠️ Nội dung này hiện chưa được cập nhật.",
      choices: buildDefaultChoices(procedure)
    };
  }

  switch (section.type) {
    case "text":
      return {
        reply: `📄 **${section.label}**\n\n${section.content}`,
        choices: buildDefaultChoices(procedure)
      };

    case "list":
      return {
        reply: renderList(section),
        choices: buildDefaultChoices(procedure)
      };

    case "steps":
      return {
        reply: renderSteps(section),
        choices: buildDefaultChoices(procedure)
      };

    case "forms":
      return {
        reply: renderForms(section),
        choices: buildDefaultChoices(procedure)
      };

    default:
      return {
        reply: "⚠️ Không hỗ trợ loại nội dung này.",
        choices: buildDefaultChoices(procedure)
      };
  }
}
