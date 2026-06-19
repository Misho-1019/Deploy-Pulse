interface SlackPayload {
  webhookUrl: string;
  monitorName: string;
  monitorUrl: string;
  isDown: boolean;
}

export async function sendSlack(payload: SlackPayload) {
  const safeName = payload.monitorName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const safeUrl = payload.monitorUrl
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text" as const,
        text: payload.isDown ? "\u{1F534} Monitor Down" : "\u2705 Service Recovered",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn" as const,
          text: `*Service:*\n${safeName}`,
        },
        {
          type: "mrkdwn" as const,
          text: `*URL:*\n${safeUrl}`,
        },
        {
          type: "mrkdwn" as const,
          text: `*Time:*\n${new Date().toLocaleString()}`,
        },
      ],
    },
  ];

  try {
    const response = await fetch(payload.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}`);
    }
  } catch (err) {
    console.error("[Slack] Failed to send:", err);
  }
}
