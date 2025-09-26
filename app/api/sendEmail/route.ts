import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data, error } = await resend.emails.send({
      from: "New Message<onboarding@resend.dev>",   // ✅ Correct format
      to: "myEmail",
      subject: "Multifactors Sales Website",
      text: `Name: ${body.name}\nEmail: ${body.email}\nMessage: ${body.message}`,
    });

    if (error) return Response.json({ error }, { status: 500 });
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
