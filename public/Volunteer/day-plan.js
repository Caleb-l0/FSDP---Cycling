import OpenAI from "openai";



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const { date } = req.query; // Expect date in YYYY-MM-DD format
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }

  try {
    // Fetch signed up events for the user on the given date
    const pool = require("../Postgres_config");
    const result = await pool.query(
      `
        SELECT 
          e.eventname,
          e.eventdate,
          e.description,
          e.location,
          e.starttime,
          e.endtime
        FROM eventsignups es
        INNER JOIN events e ON es.eventid = e.eventid
        WHERE es.userid = $1 AND es.status = 'Active' AND DATE(e.eventdate) = $2
        ORDER BY e.starttime ASC
      `,
      [userId, date]
    );

    const events = result.rows;

    if (events.length === 0) {
      return res.status(200).json({
        plan: `No events scheduled for ${date}. Enjoy your day!`
      });
    }

    // Build event text
    const eventText = events.map(event => `
Event: ${event.eventname}
Location: ${event.location}
Time: ${event.starttime} – ${event.endtime}
Description: ${event.description}
    `).join('\n');

    const prompt = `
You are a helpful assistant for elderly volunteers.
Based on the event info below, generate a simple daily plan.

Include:
- Event name
- Location
- Start time
- Suggested leave-by time (assume 30–40 min commute or based on distance from current location)
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
  } catch (error) {
    console.error('Error generating day plan:', error);
    res.status(500).json({ message: 'Failed to generate plan' });
  }
}




