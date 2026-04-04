export function renderSection(section) {
  if (!section || !section.type) {
    return "⚠️ Nội dung đang được cập nhật.";
  }

  const { label, type, content } = section;

  switch (type) {
    case "text":
      return `**${label}**\n\n${content}`;

    case "list":
      return (
        `**${label}**\n` +
        content.map(i => `• ${i}`).join("\n")
      );

    case "steps":
      return (
        `**${label}**\n\n` +
        content
          .map(
            (step, idx) =>
              `**Bước ${idx + 1}: ${step.title}**\n` +
              step.items.map(i => `- ${i}`).join("\n")
          )
          .join("\n\n")
      );

    case "documents":
      return (
        `**${label}**\n\n` +
        content
          .map(d =>
            `• **${d.name}**${d.required ? " *(bắt buộc)*" : ""}` +
            (d.file
              ? `\n  🔗 [Tải mẫu](${d.file})`
              : "")
          )
          .join("\n\n")
      );

    case "forms":
      return (
        `**${label}**\n\n` +
        content
          .map(f =>
            `• **${f.name}**\n🔗 [Tải mẫu](${f.file})`
          )
          .join("\n\n")
      );

    case "authority":
      return (
        `**${label}**\n\n` +
        content
          .map(a =>
            `🏛 **${a.name}**\n` +
            (a.address ? `📍 ${a.address}\n` : "") +
            (a.phone ? `📞 ${a.phone}` : "")
          )
          .join("\n\n")
      );

    default:
      return "⚠️ Kiểu nội dung chưa được hỗ trợ.";
  }
}
