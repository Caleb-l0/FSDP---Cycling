import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // 🔹 HARD-CODE for MVP (fastest)
  const eventText = `
  Volunteer Event:
  Location: Community Center
  Time: 10:00 AM – 12:00 PM
  Description: Help serve meals to seniors.
  `;

  const prompt = `
You are a helpful assistant for elderly volunteers.
Based on the event info below, generate a simple daily plan.

Include:
- Event name
- Location
- Start time
- Suggested leave-by time (assume 30–40 min commute or based on distance from currrent location)
- What to bring
- Weather advice if rain is likely (say "may rain" if unsure)

Keep it short, friendly, and easy to read.

Event info:
${eventText}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  res.status(200).json({
    plan: completion.choices[0].message.content
  });
}
